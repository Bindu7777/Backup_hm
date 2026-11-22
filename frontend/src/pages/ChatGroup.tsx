// One Happy Moments group: customer + vendor + every Super Vendor.
// What each person can read or send is enforced by the database (RLS + functions);
// this page only shows it.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import SignUpGate from "@/components/enquiry/SignUpGate";
import { supabase } from "@/lib/supabase";
import { amIStaff, useHmSession } from "@/lib/hmAuth";
import { EVENT_TYPES, budgetLabel, notifyChat, photoUrl, serviceLabel } from "@/services/enquiryService";
import { MomoBuddy, momoStyles } from "@/components/enquiry/MomoBuddy";
import MomoMascot from "@/components/momo/MomoMascot";
import { cardSounds } from "@/utils/cardSounds";

type Role = "customer" | "vendor" | "super_vendor";
type GroupHeader = {
  group_id: string; my_role: Role | null; status: string; assigned_staff_id: string | null; created_at: string;
  event_type: string; event_date: string | null; city: string; area: string | null; guests: number | null;
  budget_range: string | null; services: string[]; style_tags: string[]; notes: string | null;
  vendor_id: number; vendor_name: string; vendor_slug: string | null; vendor_phone_masked: string | null;
  customer_name: string | null; last_message_at: string | null; last_message_sender_role: Role | null;
};
type Attachment = { path: string; name: string; type: string; size: number };
type Message = {
  id: string; group_id: string; sender_user_id: string; sender_role: Role | "system";
  body: string | null; attachments: Attachment[]; created_at: string; deleted_at: string | null;
};
type CallRequest = { id: string; status: string; created_at: string };

const MAX_FILE = 10 * 1024 * 1024;
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const ChatGroup: React.FC = () => {
  const { groupId = "" } = useParams();
  const session = useHmSession();
  const me = session?.user?.id;
  const [header, setHeader] = useState<GroupHeader | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reads, setReads] = useState<Record<string, string>>({});
  const [calls, setCalls] = useState<CallRequest[]>([]);
  const [revealed, setRevealed] = useState<Record<string, { name: string; mobile: string }>>({});
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [staffName, setStaffName] = useState("");
  const [vendorLogo, setVendorLogo] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data, error: hErr } = await supabase.rpc("group_header", { p_group_id: groupId });
    const h = (Array.isArray(data) ? data[0] : data) as GroupHeader | undefined;
    if (hErr || !h) { setNotFound(true); return; }
    setNotFound(false);
    setHeader(h);
    supabase.rpc("vendor_logo", { p_vendor_id: h.vendor_id }).then(({ data: lg }) => setVendorLogo(lg ? photoUrl(lg as string) : null));
    const [{ data: msgs }, { data: r }, { data: c }] = await Promise.all([
      supabase.from("chat_messages").select("*").eq("group_id", groupId).order("created_at", { ascending: true }).limit(500),
      supabase.from("chat_reads").select("user_id, last_read_at").eq("group_id", groupId),
      supabase.from("call_requests").select("id, status, created_at").eq("group_id", groupId).order("created_at", { ascending: false }),
    ]);
    setMessages((msgs || []) as Message[]);
    setReads(Object.fromEntries((r || []).map((x: any) => [x.user_id, x.last_read_at])));
    setCalls((c || []) as CallRequest[]);
    supabase.rpc("mark_group_read", { p_group_id: groupId });
    if (h.my_role === "super_vendor") supabase.rpc("log_group_open", { p_group_id: groupId });
  }, [groupId]);

  useEffect(() => {
    if (!me) return;
    load();
    amIStaff().then((s) => s.staff && setStaffName(s.displayName || ""));
  }, [me, load]);

  // Live updates. Realtime delivers only rows this user is allowed to read.
  useEffect(() => {
    if (!me) return;
    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `group_id=eq.${groupId}` }, (payload) => {
        const m = payload.new as Message;
        setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
        if (m.sender_user_id !== me) {
          supabase.rpc("mark_group_read", { p_group_id: groupId });
          if (m.sender_role !== "system") cardSounds.receive();
        }
        if (m.sender_role === "system") load();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages", filter: `group_id=eq.${groupId}` }, (payload) => {
        const m = payload.new as Message;
        setMessages((list) => list.map((x) => (x.id === m.id ? m : x)));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_groups", filter: `id=eq.${groupId}` }, () => load())
      .subscribe();
    const poll = setInterval(() => {
      supabase.from("chat_reads").select("user_id, last_read_at").eq("group_id", groupId)
        .then(({ data }) => data && setReads(Object.fromEntries(data.map((x: any) => [x.user_id, x.last_read_at]))));
    }, 20000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [me, groupId, load]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const role = header?.my_role;
  const nameFor = (m: Message) => {
    if (m.sender_user_id === me) return "You";
    if (m.sender_role === "vendor") return header?.vendor_name || "Vendor";
    if (m.sender_role === "customer") return header?.customer_name || "Customer";
    if (m.sender_role === "super_vendor") return "Happy Moments team";
    return "";
  };

  const waiting = useMemo(() => {
    if (!header) return "";
    const last = header.last_message_sender_role;
    if (!last || last === "customer") return role === "vendor" ? "The customer is waiting for your reply" : `Waiting for ${header.vendor_name} to reply`;
    if (last === "vendor") return role === "customer" ? `${header.vendor_name} replied, your turn` : "Waiting for the customer to reply";
    return "";
  }, [header, role]);

  // "Seen" on my last message when someone else's read time is after it.
  const seenId = useMemo(() => {
    const mine = [...messages].reverse().find((m) => m.sender_user_id === me && m.sender_role !== "system");
    if (!mine) return null;
    const seen = Object.entries(reads).some(([uid, at]) => uid !== me && new Date(at) >= new Date(mine.created_at));
    return seen ? mine.id : null;
  }, [messages, reads, me]);

  const send = async () => {
    if (!header || !role || !me) return;
    const body = draft.trim();
    if (!body && files.length === 0) return;
    setSending(true);
    setError("");
    try {
      const attachments: Attachment[] = [];
      for (const f of files) {
        if (f.size > MAX_FILE) throw new Error(`${f.name} is over 10 MB.`);
        const path = `${groupId}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_").slice(-80)}`;
        const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, f, { contentType: f.type || undefined });
        if (upErr) throw upErr;
        attachments.push({ path, name: f.name, type: f.type, size: f.size });
      }
      const { data, error: insErr } = await supabase
        .from("chat_messages")
        .insert({ group_id: groupId, sender_user_id: me, sender_role: role, body: body || null, attachments })
        .select()
        .single();
      if (insErr) throw insErr;
      setMessages((list) => (list.some((x) => x.id === data.id) ? list : [...list, data as Message]));
      setDraft("");
      setFiles([]);
      cardSounds.send();
      notifyChat(groupId, "message");
    } catch (e: any) {
      setError(e?.message || "Message not sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const requestCall = async () => {
    setError("");
    const { error: e } = await supabase.rpc("request_call", { p_group_id: groupId });
    if (e) return setError(e.message);
    cardSounds.select();
    notifyChat(groupId, "message");
    load();
  };

  const reveal = async (id: string) => {
    const { data, error: e } = await supabase.rpc("call_request_contact", { p_request_id: id });
    const row = Array.isArray(data) ? data[0] : data;
    if (e || !row) return setError(e?.message || "Couldn't load the number.");
    setRevealed((r) => ({ ...r, [id]: { name: row.customer_name, mobile: row.customer_mobile } }));
  };

  const markCalled = async (id: string, status: "called" | "cancelled") => {
    const { error: e } = await supabase.rpc("set_call_status", { p_request_id: id, p_status: status });
    if (e) return setError(e.message);
    load();
  };

  const removeMessage = async (id: string) => {
    const reason = window.prompt("Why are you removing this message? (kept in the audit log)");
    if (!reason) return;
    const { error: e } = await supabase.rpc("soft_delete_message", { p_message_id: id, p_reason: reason });
    if (e) setError(e.message); else load();
  };

  // ---------- render ----------

  if (session === undefined) return <Shell><MomoLoading text="Loading…" /></Shell>;
  if (!session) {
    return (
      <Shell>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="flex justify-center"><MomoBuddy mood="wave" beat={0} size={70} /></div>
          <h1 className="mt-3 font-['Lora',serif] text-2xl font-semibold text-[#7A1F3D]">Sign in to open this chat</h1>
          <p className="mt-2 text-sm text-[#5A4A50]">Customers: use your email and password. Vendors: use the email on your vendor profile.</p>
        </div>
        <SignUpGate open mode="signin" onClose={() => {}} onDone={() => {}} />
      </Shell>
    );
  }
  if (notFound) {
    return (
      <Shell>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="flex justify-center"><MomoBuddy mood="nod" beat={0} size={70} /></div>
          <h1 className="mt-3 font-['Lora',serif] text-2xl font-semibold text-[#7A1F3D]">This chat isn't available</h1>
          <p className="mt-2 text-sm text-[#5A4A50]">
            It doesn't exist, or you're signed in as <strong>{session.user.email}</strong>, which isn't part of it.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/my-celebrations" className="rounded-2xl bg-[#7A1F3D] px-4 py-2.5 text-sm font-semibold text-white">My celebrations</Link>
            <button onClick={() => supabase.auth.signOut()} className="rounded-2xl px-4 py-2.5 text-sm font-medium text-[#7A1F3D] ring-1 ring-[#E3CFA8]">Use another account</button>
          </div>
        </div>
      </Shell>
    );
  }
  if (!header) return <Shell><MomoLoading text="Opening your group chat…" /></Shell>;

  const pendingCall = calls.find((c) => c.status === "pending");
  const emoji = EVENT_TYPES.find((e) => e.key === header.event_type)?.emoji || "🎉";
  const humanMessages = messages.filter((m) => m.sender_role !== "system");
  const myCount = humanMessages.filter((m) => m.sender_user_id === me).length;
  const otherName = role === "vendor" ? header.customer_name || "the customer" : header.vendor_name;

  // Momo explains where the conversation stands.
  const momoLine = (() => {
    const last = header.last_message_sender_role;
    if (role === "customer") {
      if (humanMessages.length === 0) return `I've shared your card with ${header.vendor_name} 💌 Say hi to get started. I'll email you when they reply!`;
      if (last === "vendor" || last === "super_vendor") return `${last === "vendor" ? header.vendor_name : "The Happy Moments team"} replied! Your turn 💬`;
      return `Message sent! Waiting for ${header.vendor_name} to reply. Our team nudges vendors who take too long ⏳`;
    }
    if (role === "vendor") {
      if (!last || last === "customer") return `${header.customer_name || "The customer"} is waiting for your reply. Quick replies win bookings ⚡`;
      return `Waiting for ${header.customer_name || "the customer"} to reply.`;
    }
    return waiting ? `Team view: ${waiting.toLowerCase()}.` : "You're in this group as the Happy Moments team.";
  })();

  const quickReplies = role === "customer"
    ? ["Hi! Are you available on my date?", "Could you share your packages and prices?", "Can you share photos of similar events?", "What's included, and what costs extra?"]
    : role === "vendor"
      ? ["Thank you for reaching out! Could you share the exact date and venue?", "We're available on your date 🎉", "Here are our packages:"]
      : [];
  const showQuick = quickReplies.length > 0 && myCount < 2 && header.status === "open";

  // Messages grouped by day.
  const dayLabel = (iso: string) => {
    const d = new Date(iso); const today = new Date(); const y = new Date(); y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <Shell>
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-3 pb-6 sm:px-4">
        {/* Group header */}
        <div className="flex items-center justify-between gap-3">
          <Link to={role === "super_vendor" ? "/team" : "/my-celebrations"}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-[#7A1F3D] ring-1 ring-[#E3CFA8] hover:bg-[#FFF3DC]">
            ← {role === "super_vendor" ? "Team dashboard" : "My celebrations"}
          </Link>
          {staffName && <span className="truncate text-xs text-[#7D6B71]">Signed in as {staffName} (Super Vendor)</span>}
        </div>

        <section className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_26px_rgba(122,31,61,0.08)] ring-1 ring-[#EFDDBD]">
          <div className="flex items-center gap-3 bg-[#7A1F3D] px-4 py-3 text-white"
            style={{ backgroundImage: "radial-gradient(rgba(232,190,96,0.22) 1.2px, transparent 1.3px)", backgroundSize: "14px 14px" }}>
            <Avatar src={vendorLogo} label={header.vendor_name} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-['Lora',serif] text-lg font-semibold">
                {role === "vendor" ? header.customer_name || "Customer" : role === "super_vendor" ? `${header.customer_name || "Customer"} ↔ ${header.vendor_name}` : header.vendor_name}
              </h1>
              <p className="truncate text-xs text-[#F6D58A]">
                Happy Moments group · {role === "customer" ? "You" : header.customer_name || "Customer"}, {header.vendor_name} & our team
              </p>
            </div>
            <div className="flex -space-x-2" aria-hidden>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F6D58A] text-xs font-bold text-[#7A1F3D] ring-2 ring-[#7A1F3D]">
                {(role === "vendor" ? header.vendor_name : header.customer_name || "You").slice(0, 1).toUpperCase()}
              </span>
              <img src="/logo.jpg" alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-[#7A1F3D]" />
            </div>
          </div>

          {/* Pinned enquiry */}
          <div className="px-4 pb-4 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>{emoji}</span>
              <p className="font-['Lora',serif] text-[17px] font-semibold text-[#7A1F3D]">
                {header.event_type}
                <span className="font-sans text-sm font-normal text-[#7D6B71]">
                  {" "}· {header.event_date ? new Date(`${header.event_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "date not fixed"}
                </span>
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[12px]">
              <Chip>📍 {header.area ? `${header.area}, ` : ""}{header.city}</Chip>
              <Chip>👥 {header.guests ? `~${header.guests} guests` : "Guests not given"}</Chip>
              <Chip>💰 {header.budget_range ? budgetLabel(header.budget_range) : "Budget not decided"}</Chip>
              <Chip>✨ {header.services.map(serviceLabel).join(", ")}</Chip>
              {header.style_tags.length > 0 && <Chip>🎨 {header.style_tags.map((t) => t[0].toUpperCase() + t.slice(1)).join(", ")}</Chip>}
            </div>
            {header.notes && <p className="mt-2 rounded-xl bg-[#FFF8EC] px-3 py-2 text-sm italic text-[#5A4A50]">“{header.notes}”</p>}

            {role === "customer" && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {pendingCall ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">📞 Call requested. {header.vendor_name} will call you</span>
                ) : (
                  <button onClick={requestCall}
                    className="rounded-full bg-[#F6D58A] px-3.5 py-1.5 text-sm font-semibold text-[#5A1E33] transition hover:bg-[#F2C964] active:scale-[.97]">
                    📞 Request a call
                  </button>
                )}
                <span className="text-xs text-[#7D6B71]">Vendor number: <span className="font-mono">{header.vendor_phone_masked || "hidden"}</span> · yours stays private until you ask for a call</span>
              </div>
            )}
            {(role === "vendor" || role === "super_vendor") && calls.filter((c) => c.status === "pending").map((c) => (
              <div key={c.id} className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
                <span>📞 The customer asked for a call ({fmtTime(c.created_at)}).</span>
                {revealed[c.id] ? (
                  <a href={`tel:${revealed[c.id].mobile}`} className="font-semibold underline">{revealed[c.id].name}: {revealed[c.id].mobile}</a>
                ) : (
                  <button onClick={() => reveal(c.id)} className="rounded-lg bg-white px-2 py-1 font-medium ring-1 ring-emerald-200">Show number</button>
                )}
                <button onClick={() => markCalled(c.id, "called")} className="rounded-lg bg-emerald-600 px-2 py-1 font-medium text-white">Mark called</button>
              </div>
            ))}
          </div>
        </section>

        {/* Momo: where things stand */}
        <MomoBuddy size={52} mood={humanMessages.length === 0 ? "wave" : "nod"} beat={humanMessages.length}
          say={momoLine} onTap={() => cardSounds.momo()} />

        {/* Messages */}
        <section aria-label="Messages" aria-live="polite"
          className="flex min-h-[38vh] flex-col gap-2 rounded-3xl bg-[#FFFBF4] p-3 ring-1 ring-[#F0DFC0] sm:p-4"
          style={{ backgroundImage: "radial-gradient(rgba(212,166,58,0.10) 1px, transparent 1.1px)", backgroundSize: "16px 16px" }}>
          {messages.map((m, i) => {
            const newDay = i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(m.created_at).toDateString();
            const divider = newDay && (
              <div className="my-1 flex items-center gap-2 text-[11px] font-medium text-[#A8792A]" aria-hidden>
                <span className="h-px flex-1 bg-[#EAD7B7]" />{dayLabel(m.created_at)}<span className="h-px flex-1 bg-[#EAD7B7]" />
              </div>
            );
            if (m.sender_role === "system") {
              return (
                <React.Fragment key={m.id}>
                  {divider}
                  <div className="flex items-end gap-2">
                    <span className="shrink-0"><MomoMascot size={30} isWaving={false} interactive={false} playSoundOnClick={false} showSparkle={false} title="Momo" /></span>
                    <p className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[13px] text-[#5A4A50] ring-1 ring-[#EAD7B7]">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#A8792A]">Momo · Happy Moments</span>
                      {m.body}
                    </p>
                  </div>
                </React.Fragment>
              );
            }
            const mine = m.sender_user_id === me;
            const staffMsg = m.sender_role === "super_vendor";
            return (
              <React.Fragment key={m.id}>
                {divider}
                <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  {!mine && (
                    <span className="mb-0.5 flex items-center gap-1 px-1 text-[11px] font-semibold text-[#7A1F3D]">
                      {nameFor(m)}
                      {staffMsg && <span className="rounded-full bg-[#F6D58A] px-1.5 text-[9px] font-bold uppercase text-[#5A1E33]">Team</span>}
                    </span>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${
                    m.deleted_at ? "bg-white italic text-[#8C7A80] ring-1 ring-[#EEE]"
                    : mine ? "rounded-br-sm bg-[#7A1F3D] text-white"
                    : staffMsg ? "rounded-bl-sm bg-[#FFF3DC] text-[#5A1E33] ring-1 ring-[#EFD9AE]"
                    : "rounded-bl-sm bg-white text-[#3D2A30] ring-1 ring-[#EEE3CC]"}`}>
                    {m.deleted_at ? "Message removed by Happy Moments" : (
                      <>
                        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                        {m.attachments?.length > 0 && <div className="mt-1.5 flex flex-col gap-1.5">{m.attachments.map((a) => <AttachmentView key={a.path} a={a} mine={mine} />)}</div>}
                      </>
                    )}
                    <span className={`mt-0.5 block text-right text-[10px] ${mine ? "text-white/70" : "text-[#8C7A80]"}`}>
                      {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                      {seenId === m.id && " · Seen ✓"}
                    </span>
                  </div>
                  {role === "super_vendor" && !m.deleted_at && (
                    <button onClick={() => removeMessage(m.id)} className="px-1 text-[11px] text-rose-600 underline">Remove</button>
                  )}
                </div>
              </React.Fragment>
            );
          })}
          {humanMessages.length === 0 && (
            <p className="my-auto py-6 text-center text-sm text-[#7D6B71]">No messages yet. Say hi to {otherName}! 👋</p>
          )}
          <div ref={bottomRef} />
        </section>

        {/* Composer */}
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        {role && header.status === "open" ? (
          <div className="rounded-3xl bg-white p-3 shadow-[0_6px_20px_rgba(122,31,61,0.06)] ring-1 ring-[#EFDDBD]">
            {showQuick && (
              <div className="mb-2">
                <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#A8792A]">🐹 Momo suggests</p>
                <div className="hm-no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                  {quickReplies.map((q) => (
                    <button key={q} type="button" onClick={() => { cardSounds.tap(); setDraft(q); }}
                      className="shrink-0 rounded-full bg-[#FFF3DC] px-3 py-1.5 text-[13px] text-[#5A1E33] ring-1 ring-[#EFD9AE] transition hover:bg-[#FBE6BE] active:scale-[.97]">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-full bg-[#FFF3DC] px-2 py-0.5 text-xs text-[#5A1E33]">
                    📎 {f.name}
                    <button aria-label={`Remove ${f.name}`} onClick={() => setFiles((l) => l.filter((_, j) => j !== i))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-lg text-[#7A1F3D] hover:bg-[#FFF3DC]" title="Attach photos or files">
                <span aria-hidden>📎</span><span className="sr-only">Attach photos or files</span>
                <input type="file" multiple className="hidden" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => { setFiles((l) => [...l, ...Array.from(e.target.files || [])].slice(0, 5)); e.target.value = ""; }} />
              </label>
              <textarea rows={1} value={draft} maxLength={4000} onChange={(e) => setDraft(e.target.value)} aria-label="Message"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={role === "super_vendor" ? "Message as Happy Moments team…" : `Message ${otherName}…`}
                className="max-h-40 min-h-[44px] flex-1 resize-none rounded-2xl border border-[#E3CFA8] bg-[#FFFBF4] px-3.5 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#D4A63A]" />
              <button onClick={send} disabled={sending || (!draft.trim() && files.length === 0)} aria-label="Send message"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#7A1F3D] text-white shadow-[0_4px_12px_rgba(122,31,61,0.3)] transition hover:bg-[#661833] active:scale-95 disabled:opacity-40 disabled:shadow-none">
                {sending ? "…" : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>}
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-[#8C7A80]">
              🔒 Messages can't be edited or deleted once sent. Keep the conversation here: Happy Moments is not responsible for conversations or agreements outside the official groups.
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-[#7D6B71]">This group is closed.</p>
        )}
      </div>
      <style>{momoStyles + ".hm-no-scrollbar{scrollbar-width:none}.hm-no-scrollbar::-webkit-scrollbar{display:none}"}</style>
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#FFF8EC] text-[#3D2A30]"><Header /><div className="pt-[96px] sm:pt-28">{children}</div></div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded-full bg-[#FFF8EC] px-2.5 py-1 text-[#5A1E33] ring-1 ring-[#F0DFC0]">{children}</span>
);

const Avatar: React.FC<{ src: string | null; label: string }> = ({ src, label }) =>
  src ? (
    <img src={src} alt="" className="h-11 w-11 shrink-0 rounded-full bg-white object-contain p-0.5 ring-2 ring-[#D4A63A]" />
  ) : (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F6D58A] font-['Lora',serif] text-lg font-semibold text-[#7A1F3D] ring-2 ring-[#D4A63A]" aria-hidden>
      {label.slice(0, 1).toUpperCase()}
    </span>
  );

const MomoLoading: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center gap-2 py-20 text-[#7D6B71]">
    <MomoBuddy mood="bounce" beat={0} size={60} />
    <p>{text}</p>
    <style>{momoStyles}</style>
  </div>
);

// Private files: shown through short-lived signed links.
const AttachmentView: React.FC<{ a: Attachment; mine: boolean }> = ({ a, mine }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("chat-attachments").createSignedUrl(a.path, 3600).then(({ data }) => setUrl(data?.signedUrl || null));
  }, [a.path]);
  if (a.type?.startsWith("image/") && url) {
    return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={a.name} className="max-h-60 rounded-xl object-cover" /></a>;
  }
  return (
    <a href={url || undefined} target="_blank" rel="noreferrer" className={`text-sm underline ${mine ? "text-white" : "text-[#7A1F3D]"}`}>
      📄 {a.name} ({Math.max(1, Math.round(a.size / 1024))} KB)
    </a>
  );
};

export default ChatGroup;
