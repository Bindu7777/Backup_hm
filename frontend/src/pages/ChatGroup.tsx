// One Happy Moments group: customer + vendor + every Super Vendor.
// What each person can read or send is enforced by the database (RLS + functions);
// this page only shows it.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import SignUpGate from "@/components/enquiry/SignUpGate";
import { supabase } from "@/lib/supabase";
import { amIStaff, useHmSession } from "@/lib/hmAuth";
import { budgetLabel, notifyChat, serviceLabel } from "@/services/enquiryService";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data, error: hErr } = await supabase.rpc("group_header", { p_group_id: groupId });
    const h = (Array.isArray(data) ? data[0] : data) as GroupHeader | undefined;
    if (hErr || !h) { setNotFound(true); return; }
    setNotFound(false);
    setHeader(h);
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
        if (m.sender_user_id !== me) supabase.rpc("mark_group_read", { p_group_id: groupId });
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

  if (session === undefined) return <Shell><p className="py-20 text-center text-[#6E7A8A]">Loading…</p></Shell>;
  if (!session) {
    return (
      <Shell>
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="font-serif text-2xl font-semibold text-[#1D3C6A]">Sign in to open this chat</h1>
          <p className="mt-2 text-sm text-[#4A5A70]">Use the email this group was shared with. Vendors: use the email on your vendor profile.</p>
        </div>
        <SignUpGate open mode="signin" onClose={() => {}} onDone={() => {}} />
      </Shell>
    );
  }
  if (notFound) {
    return (
      <Shell>
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="font-serif text-2xl font-semibold text-[#1D3C6A]">This chat isn't available</h1>
          <p className="mt-2 text-sm text-[#4A5A70]">
            It doesn't exist, or you're signed in as <strong>{session.user.email}</strong>, which isn't part of it.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/my-chats" className="rounded-xl bg-[#1D3C6A] px-4 py-2 text-sm font-semibold text-white">My chats</Link>
            <button onClick={() => supabase.auth.signOut()} className="rounded-xl px-4 py-2 text-sm text-[#1D3C6A] ring-1 ring-[#D7DFEA]">Use another email</button>
          </div>
        </div>
      </Shell>
    );
  }
  if (!header) return <Shell><p className="py-20 text-center text-[#6E7A8A]">Opening chat…</p></Shell>;

  const pendingCall = calls.find((c) => c.status === "pending");

  return (
    <Shell>
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-3 pb-6 pt-4 sm:px-4">
        <div className="flex items-center justify-between text-sm">
          <Link to={role === "super_vendor" ? "/team" : "/my-chats"} className="text-[#1D3C6A] underline">← {role === "super_vendor" ? "Team dashboard" : "My chats"}</Link>
          {staffName && <span className="text-xs text-[#6E7A8A]">Signed in as {staffName} (Super Vendor)</span>}
        </div>

        {/* Pinned enquiry summary */}
        <section className="rounded-3xl bg-white p-4 ring-1 ring-[#F3E3C3] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C08A1E]">📌 Enquiry</p>
              <h1 className="font-serif text-xl font-semibold text-[#1D3C6A]">
                {header.event_type}{header.event_date ? ` · ${new Date(header.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
              </h1>
            </div>
            <span className="rounded-full bg-[#E3E9F2] px-3 py-1 text-xs font-medium text-[#1D3C6A]">
              {role === "customer" ? header.vendor_name : role === "vendor" ? header.customer_name || "Customer" : `${header.customer_name || "Customer"} ↔ ${header.vendor_name}`}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-[#4A5A70] sm:grid-cols-4">
            <Info k="Area" v={`${header.area ? `${header.area}, ` : ""}${header.city}`} />
            <Info k="Guests" v={header.guests ? `~${header.guests}` : "Not given"} />
            <Info k="Budget" v={budgetLabel(header.budget_range)} />
            <Info k="Services" v={header.services.map(serviceLabel).join(", ")} />
            {header.style_tags.length > 0 && <Info k="Style" v={header.style_tags.join(", ")} />}
          </dl>
          {header.notes && <p className="mt-2 rounded-xl bg-[#FFFBF3] p-2 text-sm text-[#4A5A70]">“{header.notes}”</p>}
          {role === "customer" && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-[#6E7A8A]">Vendor number: <span className="font-mono">{header.vendor_phone_masked || "hidden"}</span></span>
              {pendingCall ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">📞 Call requested, the vendor will call you</span>
              ) : (
                <button onClick={requestCall} className="rounded-xl px-3 py-1.5 text-sm font-medium text-[#1D3C6A] ring-1 ring-[#D7DFEA] hover:bg-[#F4F7FB]">📞 Request a call</button>
              )}
            </div>
          )}
          {(role === "vendor" || role === "super_vendor") && calls.filter((c) => c.status === "pending").map((c) => (
            <div key={c.id} className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
              <span>📞 The customer asked for a call ({fmtTime(c.created_at)}).</span>
              {revealed[c.id] ? (
                <a href={`tel:${revealed[c.id].mobile}`} className="font-semibold underline">{revealed[c.id].name}: {revealed[c.id].mobile}</a>
              ) : (
                <button onClick={() => reveal(c.id)} className="rounded-lg bg-white px-2 py-1 font-medium ring-1 ring-emerald-200">Show number</button>
              )}
              <button onClick={() => markCalled(c.id, "called")} className="rounded-lg bg-emerald-600 px-2 py-1 font-medium text-white">Mark called</button>
            </div>
          ))}
        </section>

        {waiting && (
          <p className="text-center text-xs font-medium text-[#9A6B12]">⏳ {waiting}</p>
        )}

        {/* Messages */}
        <section className="flex min-h-[40vh] flex-col gap-2 rounded-3xl bg-[#FFFBF3] p-3 ring-1 ring-[#F3E3C3] sm:p-4">
          {messages.map((m) => {
            if (m.sender_role === "system") {
              return <p key={m.id} className="mx-auto max-w-[90%] rounded-full bg-white px-3 py-1 text-center text-xs text-[#6E7A8A] ring-1 ring-[#F3E3C3]">{m.body}</p>;
            }
            const mine = m.sender_user_id === me;
            const staffMsg = m.sender_role === "super_vendor";
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <span className="mb-0.5 px-1 text-[11px] text-[#8A94A3]">{nameFor(m)} · {fmtTime(m.created_at)}</span>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${
                  m.deleted_at ? "bg-white italic text-[#8A94A3] ring-1 ring-[#EEE]"
                  : mine ? "bg-[#1D3C6A] text-white" : staffMsg ? "bg-[#FFF3D6] text-[#5B4310] ring-1 ring-[#F3D28A]" : "bg-white text-[#1D3C6A] ring-1 ring-[#EEE3CC]"}`}>
                  {m.deleted_at ? "Message removed by Happy Moments" : (
                    <>
                      {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                      {m.attachments?.length > 0 && <div className="mt-1.5 flex flex-col gap-1.5">{m.attachments.map((a) => <AttachmentView key={a.path} a={a} mine={mine} />)}</div>}
                    </>
                  )}
                </div>
                <div className="flex gap-2 px-1">
                  {seenId === m.id && <span className="text-[11px] text-[#5A8A5A]">Seen ✓</span>}
                  {role === "super_vendor" && !m.deleted_at && (
                    <button onClick={() => removeMessage(m.id)} className="text-[11px] text-rose-600 underline">Remove</button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </section>

        {/* Composer */}
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {role && header.status === "open" ? (
          <div className="rounded-3xl bg-white p-3 ring-1 ring-[#F3E3C3]">
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-full bg-[#E3E9F2] px-2 py-0.5 text-xs text-[#1D3C6A]">
                    📎 {f.name}
                    <button aria-label={`Remove ${f.name}`} onClick={() => setFiles((l) => l.filter((_, j) => j !== i))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <label className="cursor-pointer rounded-xl p-2.5 text-lg text-[#1D3C6A] hover:bg-[#F4F7FB]" title="Attach photos or files">
                📎
                <input type="file" multiple className="hidden" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => { setFiles((l) => [...l, ...Array.from(e.target.files || [])].slice(0, 5)); e.target.value = ""; }} />
              </label>
              <textarea rows={1} value={draft} maxLength={4000} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={role === "super_vendor" ? "Message as Happy Moments team…" : "Type a message…"}
                className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-[#E8D9B8] px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
              <button onClick={send} disabled={sending || (!draft.trim() && files.length === 0)}
                className="rounded-xl bg-[#F57C00] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{sending ? "…" : "Send"}</button>
            </div>
            <p className="mt-2 text-[11px] text-[#8A94A3]">
              Messages can't be edited or deleted once sent. Keep the conversation here: Happy Moments is not responsible for conversations or agreements outside the official groups.
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-[#6E7A8A]">This group is closed.</p>
        )}
      </div>
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#FFF8EC]"><Header /><div className="pt-24">{children}</div></div>
);

const Info: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div><dt className="text-[11px] uppercase tracking-wide text-[#8A94A3]">{k}</dt><dd className="font-medium text-[#1D3C6A]">{v}</dd></div>
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
    <a href={url || undefined} target="_blank" rel="noreferrer" className={`text-sm underline ${mine ? "text-white" : "text-[#1D3C6A]"}`}>
      📄 {a.name} ({Math.max(1, Math.round(a.size / 1024))} KB)
    </a>
  );
};

export default ChatGroup;
