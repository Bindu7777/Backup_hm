// A matched vendor card. Never shows phone, WhatsApp or email: the only way to
// reach the vendor is Request a quote, which opens a Happy Moments group chat.

import React from "react";
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
  const photos = (vendor.photos || []).filter(Boolean).slice(0, 3);
  const tags = (vendor.categories || []).slice(0, 2);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_26px_rgba(122,31,61,0.08)] ring-1 ring-[#EFDDBD] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(122,31,61,0.14)]">
      {/* 3 work photos: one large, two small. Fixed ratio so nothing shifts while loading. */}
      <div className="grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-1 bg-[#FBF1DE]">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`relative overflow-hidden bg-gradient-to-br from-[#FFF3DC] to-[#F7E2BC] ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
            {photos[i] ? (
              <img src={photos[i]} alt={`${vendor.brand_name} work ${i + 1}`} loading="lazy" decoding="async"
                className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-[#B88A2E]" aria-hidden>
                <span className={i === 0 ? "text-3xl" : "text-lg"}>🌼</span>
                {i === 0 && photos.length === 0 && <span className="mt-1 text-[11px] font-medium">Photos coming soon</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-['Lora',serif] text-lg font-semibold leading-tight text-[#7A1F3D]">
          {vendor.brand_name}
          {vendor.verified && <span className="ml-1.5 align-middle font-sans text-[11px] font-semibold text-[#1F7A4A]">✓ Verified</span>}
        </h3>
        <p className="text-[13px] text-[#6D4A55]">📍 {vendor.area_label}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-[#FFF3DC] px-2.5 py-0.5 text-[11px] font-medium text-[#7A4E0E] ring-1 ring-[#EFD9AE]">{t}</span>
            ))}
          </div>
        )}
        <p className="mt-auto pt-1 text-sm font-semibold text-[#5A1E33]">
          {vendor.starting_price ? `Starting from ${formatPrice(vendor.starting_price)}` : "Price on request"}
          <span className="block text-[11px] font-normal text-[#7D6B71]">Final quote depends on your event</span>
        </p>
        <button onClick={() => onRequestQuote(vendor)} disabled={busy}
          className="mt-1 rounded-2xl bg-[#7A1F3D] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#661833] active:scale-[.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A63A] focus-visible:ring-offset-2 disabled:opacity-60">
          {busy ? "Opening chat…" : "Request a quote"}
        </button>
        <Link to={`/vendor/${vendor.vendor_id}`} className="text-center text-xs font-medium text-[#7A1F3D] underline-offset-2 hover:underline">
          View their work
        </Link>
      </div>
    </article>
  );
};

export default MatchCard;
