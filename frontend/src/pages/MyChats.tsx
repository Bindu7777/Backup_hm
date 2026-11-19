// "My celebrations": the signed-in customer's history, every card they made with
// its group chats underneath. Vendors (and the Happy Moments team) see their
// customer chats here too.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import SignUpGate from "@/components/enquiry/SignUpGate";
import { MomoBuddy, momoStyles } from "@/components/enquiry/MomoBuddy";
import { supabase } from "@/lib/supabase";
import { amIStaff, getMyCustomerProfile, signOutHm, useHmSession } from "@/lib/hmAuth";
import { EVENT_TYPES, budgetLabel, claimPendingEnquiry, getPendingEnquiry, serviceLabel } from "@/services/enquiryService";

type Chat = { group_id: string; vendor_name: string; last_message_at: string | null; last_message_sender_role: string | null; unread: boolean };
type Celebration = {
  enquiry_id: string; event_type: string; event_date: string | null; city: string; area: string | null; guests: number | null;
  budget_range: string | null; services: string[]; style_tags: string[]; created_at: string; chats: Chat[];
};
type GroupRow = {
  group_id: string; my_role: string; event_type: string; event_date: string | null; vendor_name: string;
  customer_name: string | null; last_message_at: string | null; last_message_sender_role: string | null; unread: boolean;
};

const fmtDate = (d: string) => new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtWhen = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const MyChats: React.FC = () => {
  const session = useHmSession();
  const [cards, setCards] = useState<Celebration[] | null>(null);
  const [vendorChats, setVendorChats] = useState<GroupRow[]>([]);
  const [staff, setStaff] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!session) { setCards(null); return; }
    (async () => {
      // A card filled before signing in on this device: attach it to the account.
      const pending = getPendingEnquiry();
      if (pending?.claimToken) await claimPendingEnquiry(pending).catch(() => undefined);
      const [mine, groups, s, profile] = await Promise.all([
        supabase.rpc("my_celebrations"),
        supabase.rpc("my_groups"),
        amIStaff(),
        getMyCustomerProfile().catch(() => null),
      ]);
      setCards(((mine.data || []) as Celebration[]));
      setVendorChats(((groups.data || []) as GroupRow[]).filter((g) => g.my_role === "vendor"));
      setStaff(s.staff);
      setName(profile?.full_name?.split(/\s+/)[0] || "");
    })();
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#FFF8EC] text-[#3D2A30]">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-[104px] sm:pt-32">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A8792A]">Your account</p>
            <h1 className="font-['Lora',serif] text-[30px] font-semibold text-[#7A1F3D]">
              {name ? `${name}'s celebrations` : "My celebrations"}
            </h1>
          </div>
          {session && <MomoBuddy size={54} mood="wave" beat={0} />}
        </div>

        {session === null && (
          <>
            <p className="mt-2 text-sm text-[#5A4A50]">Sign in to see your celebration cards and conversations.</p>
            <SignUpGate open mode="signin" onClose={() => {}} onDone={() => {}} />
          </>
        )}
        {session && (
          <p className="mt-1 text-sm text-[#7D6B71]">
            {session.user.email} · <button className="underline" onClick={signOutHm}>Sign out</button>
            {staff && <> · <Link to="/team" className="font-medium text-[#7A1F3D] underline">Team dashboard</Link></>}
          </p>
        )}

        {session && cards === null && <p className="mt-10 text-center text-[#7D6B71]">Loading your celebrations…</p>}

        {session && cards && cards.length === 0 && vendorChats.length === 0 && (
          <div className="mt-8 rounded-3xl bg-white p-6 text-center ring-1 ring-[#F0DFC0]">
            <p className="font-['Lora',serif] text-xl text-[#7A1F3D]">No celebration cards yet</p>
            <p className="mt-1 text-sm text-[#5A4A50]">Make your first card and we'll find vendors for you.</p>
            <Link to="/smart-request" className="mt-4 inline-block rounded-2xl bg-[#7A1F3D] px-5 py-3 text-sm font-semibold text-white">Make a card 💌</Link>
          </div>
        )}

        {cards && cards.length > 0 && (
          <section className="mt-6 space-y-5" aria-label="Your celebration cards">
            {cards.map((c) => {
              const emoji = EVENT_TYPES.find((e) => e.key === c.event_type)?.emoji || "🎉";
              return (
                <article key={c.enquiry_id} className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_26px_rgba(122,31,61,0.08)] ring-1 ring-[#EFDDBD]">
                  <div className="flex items-center gap-3 bg-[#7A1F3D] px-4 py-3 text-white"
                    style={{ backgroundImage: "radial-gradient(rgba(232,190,96,0.22) 1.2px, transparent 1.3px)", backgroundSize: "14px 14px" }}>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#D4A63A] bg-[#6E1630] text-xl" aria-hidden>{emoji}</span>
                    <div className="min-w-0">
                      <h2 className="truncate font-['Lora',serif] text-lg font-semibold">{c.event_type}</h2>
                      <p className="truncate text-[13px] text-[#F6D58A]">
                        {c.event_date ? fmtDate(c.event_date) : "Date not fixed"} · {[c.area, c.city].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    <p className="text-[13px] text-[#5A4A50]">
                      {c.services.map(serviceLabel).join(", ")}
                      {c.guests ? ` · ~${c.guests} guests` : ""} · {c.budget_range ? budgetLabel(c.budget_range) : "Budget not decided"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8C7A80]">Card made {fmtDate(c.created_at)}</p>

                    <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#A8792A]">Conversations</h3>
                    {c.chats.length === 0 ? (
                      <p className="mt-1 text-sm text-[#5A4A50]">No chats yet. Tap Connect on a vendor to start one.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {c.chats.map((ch) => {
                          const yourTurn = ch.last_message_sender_role === "vendor" || ch.last_message_sender_role === "super_vendor";
                          return (
                            <li key={ch.group_id}>
                              <Link to={`/chat/${ch.group_id}`}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFF8EC] px-3 py-2.5 ring-1 ring-[#F0DFC0] transition hover:ring-[#D4A63A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A63A]">
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold text-[#5A1E33]">💬 {ch.vendor_name}</span>
                                  <span className="block truncate text-xs text-[#7D6B71]">
                                    {ch.last_message_at ? `Last message ${fmtWhen(ch.last_message_at)}` : "Group created"}
                                  </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-2">
                                  {yourTurn && <span className="rounded-full bg-[#FFF3DC] px-2 py-0.5 text-[11px] font-medium text-[#7A4E0E]">Your reply</span>}
                                  {ch.unread && <span className="h-2.5 w-2.5 rounded-full bg-[#C9567A]" aria-label="Unread messages" />}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
            <div className="text-center">
              <Link to="/smart-request" className="inline-block rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#7A1F3D] ring-1 ring-[#E3CFA8] hover:bg-[#FFF3DC]">
                + Make another card
              </Link>
            </div>
          </section>
        )}

        {vendorChats.length > 0 && (
          <section className="mt-10" aria-label="Customer chats">
            <h2 className="font-['Lora',serif] text-xl font-semibold text-[#7A1F3D]">Customer chats</h2>
            <ul className="mt-3 space-y-2">
              {vendorChats.map((r) => (
                <li key={r.group_id}>
                  <Link to={`/chat/${r.group_id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#F0DFC0] hover:ring-[#D4A63A]">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[#5A1E33]">{r.customer_name || "Customer"}</span>
                      <span className="block truncate text-sm text-[#7D6B71]">
                        {r.event_type}{r.event_date ? ` · ${fmtDate(r.event_date)}` : ""}{r.last_message_at ? ` · ${fmtWhen(r.last_message_at)}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {r.last_message_sender_role === "customer" && <span className="rounded-full bg-[#FFF3DC] px-2 py-0.5 text-[11px] font-medium text-[#7A4E0E]">Your reply</span>}
                      {r.unread && <span className="h-2.5 w-2.5 rounded-full bg-[#C9567A]" aria-label="Unread messages" />}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <style>{momoStyles}</style>
    </div>
  );
};

export default MyChats;
