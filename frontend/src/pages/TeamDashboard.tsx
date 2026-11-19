// Super Vendor dashboard: every group, who is waiting on whom, and free
// click-to-chat WhatsApp reminders (no paid API). Staff-only data comes from
// staff_group_overview(), which refuses anyone not in staff_roles.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import SignUpGate from "@/components/enquiry/SignUpGate";
import { supabase } from "@/lib/supabase";
import { amIStaff, signOutHm, useHmSession } from "@/lib/hmAuth";
import { buildReminder } from "@/services/nudgeService";

type Row = {
  group_id: string; created_at: string; status: string;
  customer_name: string | null; customer_mobile: string | null; customer_email: string | null;
  vendor_id: number; vendor_name: string; vendor_whatsapp: string | null; vendor_email: string | null;
  event_type: string; event_date: string | null;
  last_message_at: string | null; last_message_sender_role: string | null; minutes_since_last: number;
  waiting_on: "vendor" | "customer" | null; flagged: boolean;
  assigned_staff_id: string | null; assigned_staff_name: string | null; last_nudge_at: string | null; pending_call: boolean;
};
type SortKey = "waiting" | "event" | "created";

const fmtWait = (min: number) => (min < 60 ? `${Math.round(min)} min` : min < 1440 ? `${Math.floor(min / 60)} h ${Math.round(min % 60)} m` : `${Math.floor(min / 1440)} d ${Math.floor((min % 1440) / 60)} h`);

const TeamDashboard: React.FC = () => {
  const session = useHmSession();
  const [staff, setStaff] = useState<{ staff: boolean; displayName?: string } | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [settings, setSettings] = useState<{ vendor_wait_minutes: number; customer_wait_minutes: number }>({ vendor_wait_minutes: 120, customer_wait_minutes: 360 });
  const [sort, setSort] = useState<SortKey>("waiting");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const [{ data, error: e }, { data: s }] = await Promise.all([
      supabase.rpc("staff_group_overview"),
      supabase.from("chat_settings").select("key, value"),
    ]);
    if (e) { setError(e.message); return; }
    setError("");
    setRows((data || []) as Row[]);
    if (s) setSettings((cur) => ({ ...cur, ...Object.fromEntries(s.map((x: any) => [x.key, x.value])) }));
    setLoadedAt(new Date());
  }, []);

  useEffect(() => {
    if (!session) { setStaff(null); return; }
    amIStaff().then((s) => { setStaff(s); if (s.staff) load(); });
  }, [session?.user?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh on any group activity, and every minute so waiting times tick over.
  useEffect(() => {
    if (!staff?.staff) return;
    const channel = supabase.channel("team-groups")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_groups" }, () => load())
      .subscribe();
    const t = setInterval(load, 60000);
    return () => { supabase.removeChannel(channel); clearInterval(t); };
  }, [staff?.staff, load]);

  const flaggedCount = rows.filter((r) => r.flagged).length;
  useEffect(() => {
    document.title = flaggedCount ? `(${flaggedCount}) Team dashboard · Happy Moments` : "Team dashboard · Happy Moments";
  }, [flaggedCount]);

  const shown = useMemo(() => {
    const list = rows.filter((r) => !onlyFlagged || r.flagged);
    return [...list].sort((a, b) =>
      sort === "waiting" ? Number(b.flagged) - Number(a.flagged) || b.minutes_since_last - a.minutes_since_last
      : sort === "event" ? (a.event_date || "9999").localeCompare(b.event_date || "9999")
      : b.created_at.localeCompare(a.created_at));
  }, [rows, sort, onlyFlagged]);

  const claim = async (r: Row, release = false) => {
    const { error: e } = await supabase.rpc("claim_group", { p_group_id: r.group_id, p_release: release });
    if (e) setError(e.message);
    load();
  };

  const remind = async (r: Row, target: "vendor" | "customer") => {
    const link = buildReminder(r, target, staff?.displayName || "Happy Moments", `${window.location.origin}/chat/${r.group_id}`);
    if (!link) { setError(`No ${target === "vendor" ? "WhatsApp/phone number for this vendor" : "mobile number for this customer"}.`); return; }
    window.open(link, "_blank", "noopener");
    const { error: e } = await supabase.rpc("log_nudge", { p_group_id: r.group_id, p_target_role: target, p_channel: "whatsapp_link" });
    if (e) setError(e.message);
    load();
  };

  const saveSetting = async (key: "vendor_wait_minutes" | "customer_wait_minutes", hours: number) => {
    const { error: e } = await supabase.rpc("set_chat_setting", { p_key: key, p_value: Math.round(hours * 60) });
    if (e) setError(e.message); else load();
  };

  const me = session?.user?.id;

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-[#1D3C6A]">Team dashboard</h1>
            {session && <p className="text-sm text-[#6E7A8A]">{session.user.email} · <button className="underline" onClick={signOutHm}>Sign out</button></p>}
          </div>
          {staff?.staff && loadedAt && <p className="text-xs text-[#8A94A3]">Updated {loadedAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p>}
        </div>

        {session === null && <SignUpGate open mode="signin" title="Team sign in" onClose={() => {}} onDone={() => {}} />}
        {session && staff && !staff.staff && (
          <p className="mt-6 rounded-2xl bg-white p-5 text-[#4A5A70] ring-1 ring-[#E6DCC8]">This account isn't a Happy Moments team account. Ask an admin to add you.</p>
        )}

        {staff?.staff && (
          <>
            {flaggedCount > 0 && (
              <div role="alert" className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-800 ring-1 ring-rose-200">
                🔔 {flaggedCount} {flaggedCount === 1 ? "group needs" : "groups need"} a nudge: someone has waited longer than the limit.
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 text-sm ring-1 ring-[#E6DCC8]">
              <label className="flex items-center gap-2">Sort
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-lg border px-2 py-1">
                  <option value="waiting">Longest waiting</option>
                  <option value="event">Event date</option>
                  <option value="created">Newest group</option>
                </select>
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} /> Flagged only</label>
              <WaitSetting label="Flag vendor after" minutes={settings.vendor_wait_minutes} onSave={(h) => saveSetting("vendor_wait_minutes", h)} />
              <WaitSetting label="Flag customer after" minutes={settings.customer_wait_minutes} onSave={(h) => saveSetting("customer_wait_minutes", h)} />
            </div>

            {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <div className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-[#E6DCC8]">
              <table className="min-w-[1000px] w-full text-left text-sm">
                <thead className="bg-[#FBF7EF] text-xs uppercase tracking-wide text-[#6E7A8A]">
                  <tr>
                    <th className="px-3 py-2">Customer</th><th className="px-3 py-2">Vendor</th><th className="px-3 py-2">Event</th>
                    <th className="px-3 py-2">Status</th><th className="px-3 py-2">Last message</th><th className="px-3 py-2">Waiting</th>
                    <th className="px-3 py-2">Assigned</th><th className="px-3 py-2">Remind</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-[#8A94A3]">No groups yet.</td></tr>}
                  {shown.map((r) => (
                    <tr key={r.group_id} className={`border-t border-[#F1EADB] ${r.flagged ? "bg-rose-50/60" : ""}`}>
                      <td className="px-3 py-2"><Link to={`/chat/${r.group_id}`} className="font-medium text-[#1D3C6A] underline">{r.customer_name || "Customer"}</Link></td>
                      <td className="px-3 py-2">{r.vendor_name}</td>
                      <td className="px-3 py-2">{r.event_type}{r.event_date ? <span className="block text-xs text-[#8A94A3]">{new Date(r.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span> : null}</td>
                      <td className="px-3 py-2">
                        {r.flagged ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Flagged</span>
                          : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{r.status}</span>}
                        {r.pending_call && <span className="mt-1 block text-xs text-emerald-700">📞 call requested</span>}
                      </td>
                      <td className="px-3 py-2">{r.last_message_sender_role ? ({ customer: "Customer", vendor: "Vendor", super_vendor: "Team" } as any)[r.last_message_sender_role] : "Nobody yet"}</td>
                      <td className="px-3 py-2">{fmtWait(r.minutes_since_last)}{r.waiting_on && <span className="block text-xs text-[#8A94A3]">on {r.waiting_on}</span>}</td>
                      <td className="px-3 py-2">
                        {r.assigned_staff_id ? (
                          <>
                            <span className="text-xs">{r.assigned_staff_id === me ? "You" : r.assigned_staff_name || "Team member"}</span>
                            {r.assigned_staff_id === me && <button onClick={() => claim(r, true)} className="ml-2 text-xs underline">Release</button>}
                          </>
                        ) : <button onClick={() => claim(r)} className="rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-[#D7DFEA]">Claim</button>}
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          const blocked = Boolean(r.assigned_staff_id && r.assigned_staff_id !== me);
                          return (
                            <div className="flex flex-col gap-1">
                              <button disabled={blocked} onClick={() => remind(r, "vendor")} className={`rounded-lg px-2 py-1 text-xs font-medium text-white disabled:opacity-40 ${r.flagged && r.waiting_on === "vendor" ? "bg-[#25A244]" : "bg-[#7FA88A]"}`}>Remind vendor</button>
                              <button disabled={blocked} onClick={() => remind(r, "customer")} className={`rounded-lg px-2 py-1 text-xs font-medium text-white disabled:opacity-40 ${r.flagged && r.waiting_on === "customer" ? "bg-[#25A244]" : "bg-[#7FA88A]"}`}>Remind customer</button>
                              {blocked && <span className="text-[10px] text-[#8A94A3]">Claimed by a teammate</span>}
                              {r.last_nudge_at && <span className="text-[10px] text-[#8A94A3]">Last nudge {new Date(r.last_nudge_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const WaitSetting: React.FC<{ label: string; minutes: number; onSave: (hours: number) => void }> = ({ label, minutes, onSave }) => {
  const [hours, setHours] = useState(String(minutes / 60));
  useEffect(() => setHours(String(minutes / 60)), [minutes]);
  return (
    <label className="flex items-center gap-2">{label}
      <input type="number" min={0.25} step={0.25} value={hours} onChange={(e) => setHours(e.target.value)}
        onBlur={() => { const h = Number(hours); if (h > 0 && Math.round(h * 60) !== minutes) onSave(h); }}
        className="w-16 rounded-lg border px-2 py-1" /> h
    </label>
  );
};

export default TeamDashboard;
