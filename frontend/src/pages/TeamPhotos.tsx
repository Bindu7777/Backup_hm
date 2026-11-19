// Team photo review: every vendor photo customers could see, with a switch to hide
// it (e.g. flyers with the vendor's phone number or email printed on them).
// Only Super Vendors / admins can load the list or flip the switch; the database
// enforces that (staff_vendor_photos, set_vendor_photo_hidden).

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import SignUpGate from "@/components/enquiry/SignUpGate";
import { supabase } from "@/lib/supabase";
import { amIStaff, signOutHm, useHmSession } from "@/lib/hmAuth";
import { setPhotoHidden } from "@/services/photoFlags";

type Photo = { vendor_id: number; brand_name: string; photo_key: string; hidden: boolean; reason: string | null; hidden_at: string | null };

// "vendor-images/71/catalog/x.jpg" -> public URL
const urlFor = (key: string) => {
  const slash = key.indexOf("/");
  return supabase.storage.from(key.slice(0, slash)).getPublicUrl(key.slice(slash + 1)).data.publicUrl;
};

const TeamPhotos: React.FC = () => {
  const session = useHmSession();
  const [staff, setStaff] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filter, setFilter] = useState<"all" | "hidden" | "shown">("all");
  const [search, setSearch] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [zoom, setZoom] = useState<Photo | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.rpc("staff_vendor_photos");
    if (e) return setError(e.message);
    setError("");
    setPhotos((data || []) as Photo[]);
  }, []);

  useEffect(() => {
    if (!session) { setStaff(null); return; }
    amIStaff().then((s) => { setStaff(s.staff); if (s.staff) load(); });
  }, [session?.user?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (p: Photo) => {
    let reason: string | undefined;
    if (!p.hidden) {
      const answer = window.prompt("Why hide this photo? (optional, e.g. phone number on flyer)", "Contact details in photo");
      if (answer === null) return;
      reason = answer;
    }
    setBusyKey(p.photo_key);
    try {
      await setPhotoHidden(p.vendor_id, p.photo_key, !p.hidden, reason);
      setPhotos((list) => list.map((x) => (x.photo_key === p.photo_key
        ? { ...x, hidden: !p.hidden, reason: !p.hidden ? reason || null : null, hidden_at: !p.hidden ? new Date().toISOString() : null }
        : x)));
      setZoom((z) => (z && z.photo_key === p.photo_key ? { ...z, hidden: !p.hidden } : z));
    } catch (e: any) {
      setError(e?.message || "Couldn't change the photo.");
    } finally {
      setBusyKey(null);
    }
  };

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = new Map<number, { name: string; photos: Photo[] }>();
    for (const p of photos) {
      if (filter === "hidden" && !p.hidden) continue;
      if (filter === "shown" && p.hidden) continue;
      if (q && !p.brand_name?.toLowerCase().includes(q) && String(p.vendor_id) !== q) continue;
      if (!out.has(p.vendor_id)) out.set(p.vendor_id, { name: p.brand_name, photos: [] });
      out.get(p.vendor_id)!.photos.push(p);
    }
    return [...out.entries()];
  }, [photos, filter, search]);

  const hiddenCount = photos.filter((p) => p.hidden).length;

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link to="/team" className="text-sm text-[#1D3C6A] underline">← Team dashboard</Link>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-[#1D3C6A]">Vendor photos</h1>
            <p className="text-sm text-[#6E7A8A]">
              Hide any photo that shows a phone number, email, WhatsApp or other contact details. Customers won't see it; the vendor still does.
            </p>
            {session && <p className="mt-1 text-xs text-[#8A94A3]">{session.user.email} · <button className="underline" onClick={signOutHm}>Sign out</button></p>}
          </div>
        </div>

        {session === null && <SignUpGate open mode="signin" title="Team sign in" onClose={() => {}} onDone={() => {}} />}
        {session && staff === false && (
          <p className="mt-6 rounded-2xl bg-white p-5 text-[#4A5A70] ring-1 ring-[#E6DCC8]">This account isn't a Happy Moments team account.</p>
        )}

        {staff && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-[#E6DCC8]">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendor name or ID"
                className="w-56 rounded-lg border px-3 py-1.5" />
              {(["all", "shown", "hidden"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
                  className={`rounded-full px-3 py-1 ${filter === f ? "bg-[#1D3C6A] text-white" : "ring-1 ring-[#D7DFEA] text-[#1D3C6A]"}`}>
                  {f === "all" ? `All (${photos.length})` : f === "hidden" ? `Hidden (${hiddenCount})` : `Shown (${photos.length - hiddenCount})`}
                </button>
              ))}
            </div>

            {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            {groups.length === 0 && <p className="mt-8 text-center text-[#8A94A3]">No photos here.</p>}

            {groups.map(([vendorId, g]) => (
              <section key={vendorId} className="mt-6">
                <h2 className="mb-2 font-semibold text-[#1D3C6A]">
                  {g.name} <span className="text-xs font-normal text-[#8A94A3]">#{vendorId} · <Link to={`/vendor/${vendorId}`} className="underline">customer view</Link></span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {g.photos.map((p) => (
                    <figure key={p.photo_key} className={`overflow-hidden rounded-xl bg-white ring-2 ${p.hidden ? "ring-rose-300" : "ring-transparent"}`}>
                      <button onClick={() => setZoom(p)} className="relative block aspect-square w-full bg-[#EFE8DA]" title="Open larger">
                        <img src={urlFor(p.photo_key)} alt="" loading="lazy" className={`absolute inset-0 h-full w-full object-cover ${p.hidden ? "opacity-40 grayscale" : ""}`} />
                        {p.hidden && <span className="absolute left-1.5 top-1.5 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Hidden</span>}
                      </button>
                      <figcaption className="p-2">
                        <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-[#1D3C6A]">
                          <span>Hide from customers</span>
                          <input type="checkbox" role="switch" checked={p.hidden} disabled={busyKey === p.photo_key}
                            onChange={() => toggle(p)} className="h-4 w-4 accent-rose-600" />
                        </label>
                        {p.hidden && p.reason && <p className="mt-1 truncate text-[10px] text-[#8A94A3]" title={p.reason}>{p.reason}</p>}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>

      {zoom && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(null)}>
          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img src={urlFor(zoom.photo_key)} alt="" className="max-h-[75vh] w-auto rounded-xl object-contain" />
            <div className="mt-3 flex items-center justify-between gap-3 text-white">
              <span className="text-sm">{zoom.brand_name}</span>
              <div className="flex gap-2">
                <button onClick={() => toggle(zoom)} disabled={busyKey === zoom.photo_key}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${zoom.hidden ? "bg-white text-[#1D3C6A]" : "bg-rose-600 text-white"}`}>
                  {zoom.hidden ? "Show to customers" : "Hide from customers"}
                </button>
                <button onClick={() => setZoom(null)} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPhotos;
