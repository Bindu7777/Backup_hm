// The signed-in person's groups: customers see their vendors, vendors see their customers.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import SignUpGate from "@/components/enquiry/SignUpGate";
import { supabase } from "@/lib/supabase";
import { amIStaff, signOutHm, useHmSession } from "@/lib/hmAuth";

type Row = {
  group_id: string; my_role: string; event_type: string; event_date: string | null; vendor_name: string;
  customer_name: string | null; last_message_at: string | null; last_message_sender_role: string | null; unread: boolean;
};

const MyChats: React.FC = () => {
  const session = useHmSession();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [staff, setStaff] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase.rpc("my_groups").then(({ data }) => setRows((data || []) as Row[]));
    amIStaff().then((s) => setStaff(s.staff));
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#FFF8EC]">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28">
        <h1 className="font-serif text-3xl font-semibold text-[#1D3C6A]">My chats</h1>
        {session === null && (
          <>
            <p className="mt-2 text-sm text-[#4A5A70]">Sign in with your email to see your Happy Moments groups. Vendors: use the email on your vendor profile.</p>
            <SignUpGate open mode="signin" onClose={() => {}} onDone={() => {}} />
          </>
        )}
        {session && (
          <p className="mt-1 text-sm text-[#6E7A8A]">
            Signed in as {session.user.email} · <button className="underline" onClick={signOutHm}>Sign out</button>
            {staff && <> · <Link to="/team" className="font-medium text-[#1D3C6A] underline">Team dashboard</Link></>}
          </p>
        )}
        {session && rows && rows.length === 0 && (
          <div className="mt-8 rounded-3xl bg-white p-6 text-center ring-1 ring-[#F3E3C3]">
            <p className="text-[#4A5A70]">No chats yet.</p>
            <Link to="/smart-request" className="mt-3 inline-block rounded-xl bg-[#F57C00] px-4 py-2 text-sm font-semibold text-white">Plan an event</Link>
          </div>
        )}
        <ul className="mt-6 space-y-3">
          {(rows || []).map((r) => {
            const other = r.my_role === "vendor" ? r.customer_name || "Customer" : r.vendor_name;
            const yourTurn = (r.my_role === "vendor" && r.last_message_sender_role === "customer")
              || (r.my_role === "customer" && r.last_message_sender_role === "vendor");
            return (
              <li key={r.group_id}>
                <Link to={`/chat/${r.group_id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#F3E3C3] hover:ring-[#F7B733]">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#1D3C6A]">{other}</p>
                    <p className="truncate text-sm text-[#6E7A8A]">
                      {r.event_type}{r.event_date ? ` · ${new Date(r.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                      {r.last_message_at ? ` · ${new Date(r.last_message_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {yourTurn && <span className="rounded-full bg-[#FFF3D6] px-2 py-0.5 text-[11px] font-medium text-[#9A6B12]">Your reply</span>}
                    {r.unread && <span className="h-2.5 w-2.5 rounded-full bg-[#F57C00]" aria-label="Unread" />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
};

export default MyChats;
