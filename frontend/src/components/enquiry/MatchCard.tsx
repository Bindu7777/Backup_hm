// A matched vendor card. Never shows phone, WhatsApp or email: the only ways to
// reach the vendor are Request quote / Chat, which open a Happy Moments group.

import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { VendorMatch } from "@/services/enquiryService";

type Props = {
  vendor: VendorMatch;
  busy?: boolean;
  onRequestQuote: (vendor: VendorMatch) => void;
};

const formatPrice = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} lakh` : `₹${n.toLocaleString("en-IN")}`;

export const MatchCard: React.FC<Props> = ({ vendor, busy, onRequestQuote }) => {
  const [photo, setPhoto] = useState(0);
  const photos = vendor.photos?.filter(Boolean) || [];
  const services = (vendor.categories || []).slice(0, 3);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(29,60,106,0.08)] ring-1 ring-[#F3E3C3] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(29,60,106,0.14)]">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#FFF3D6] to-[#FDE7C2]">
        {photos.length > 0 ? (
          <img src={photos[photo]} alt={`${vendor.brand_name} work ${photo + 1}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-[#B88A2E]">
            <span className="text-4xl" aria-hidden>🌼</span>
            <span className="text-xs font-medium">Photos coming soon</span>
          </div>
        )}
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button key={i} aria-label={`Show photo ${i + 1}`} onClick={() => setPhoto(i)}
                className={`h-2 rounded-full transition-all ${i === photo ? "w-5 bg-white" : "w-2 bg-white/60"}`} />
            ))}
          </div>
        )}
        {vendor.verified && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1D3C6A] shadow">
            ✓ Verified
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold leading-tight text-[#1D3C6A]">{vendor.brand_name}</h3>
          <span className="shrink-0 rounded-full bg-[#FFF3D6] px-2 py-0.5 text-[11px] font-medium text-[#9A6B12]">📍 {vendor.area_label}</span>
        </div>
        {vendor.good_for && <p className="line-clamp-2 text-sm text-[#4A5A70]">Good for: {vendor.good_for}</p>}
        <div className="flex flex-wrap gap-1.5">
          {services.map((s) => (
            <span key={s} className="rounded-full bg-[#E3E9F2] px-2 py-0.5 text-[11px] text-[#1D3C6A]">{s}</span>
          ))}
        </div>
        <p className="mt-auto pt-1 text-sm font-semibold text-[#1D3C6A]">
          {vendor.starting_price ? `Starts from ${formatPrice(vendor.starting_price)}` : "Price on request"}
          <span className="block text-[11px] font-normal text-[#8A94A3]">Final quote depends on your event</span>
        </p>
        <div className="flex gap-2 pt-1">
          <button onClick={() => onRequestQuote(vendor)} disabled={busy}
            className="flex-1 rounded-xl bg-[#F57C00] py-2.5 text-sm font-semibold text-white transition hover:bg-[#E26A00] disabled:opacity-60">
            {busy ? "Opening chat…" : "Request quote"}
          </button>
          <Link to={`/vendor/${vendor.vendor_id}`} className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#1D3C6A] ring-1 ring-[#D7DFEA] hover:bg-[#F4F7FB]">
            View
          </Link>
        </div>
      </div>
    </article>
  );
};

export default MatchCard;
