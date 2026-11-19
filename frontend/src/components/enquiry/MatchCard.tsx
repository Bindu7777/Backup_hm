// A matched vendor card. Never shows phone, WhatsApp or email: the only way to
// reach the vendor is Connect, which opens a Happy Moments group chat (customer,
// vendor and the Happy Moments team).
//
// Facts come from vendor_card_stats in the database and are shown only when they
// hold up: the rating is from Happy Moments reviews, or the vendor's listed rating
// when they also list a review count; events and experience are marked as shared
// by the vendor.

import React from "react";
import { Link } from "react-router-dom";
import type { VendorMatch } from "@/services/enquiryService";

type Props = {
  vendor: VendorMatch;
  busy?: boolean;
  onRequestQuote: (vendor: VendorMatch) => void;
};

const formatPrice = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1).replace(/\.0$/, "")}L` : `₹${n.toLocaleString("en-IN")}`;

// "12 Years" -> "12 yrs", "6+ years" -> "6+ yrs", "Established since 2015" -> "Since 2015"
const formatExperience = (raw?: string | null) => {
  if (!raw) return null;
  const m = raw.match(/^(\d+\s*(?:-\s*\d+)?\+?)\s*years?$/i);
  if (m) return `${m[1].replace(/\s+/g, "")} yrs`;
  const since = raw.match(/since\s+(\d{4})/i);
  if (since) return `Since ${since[1]}`;
  return raw.length <= 18 ? raw : null;
};

const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

export const MatchCard: React.FC<Props> = ({ vendor, busy, onRequestQuote }) => {
  const photos = (vendor.photos || []).filter(Boolean).slice(0, 3);
  const tags = (vendor.highlights && vendor.highlights.length > 0 ? vendor.highlights : vendor.categories || []).slice(0, 2);
  const rating = vendor.rating != null ? Number(vendor.rating) : null;
  const experience = formatExperience(vendor.experience);
  const low = vendor.price_min ?? vendor.starting_price;
  const high = vendor.price_max;
  const vendorShared = Boolean(vendor.events_done || experience);

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

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <h3 className="font-['Lora',serif] text-lg font-semibold leading-tight text-[#7A1F3D]">
            {vendor.brand_name}
            {vendor.verified && <span className="ml-1.5 align-middle font-sans text-[11px] font-semibold text-[#1F7A4A]">✓ Verified</span>}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-[#6D4A55]">
            <span>📍 {vendor.area_label}</span>
            {rating != null && rating > 0 ? (
              <span className="font-semibold text-[#5A1E33]">
                <span className="text-[#D4A63A]" aria-hidden>★</span> {rating.toFixed(1)}
                <span className="font-normal text-[#7D6B71]">
                  {" "}({vendor.review_count} {vendor.review_count === 1 ? "review" : "reviews"}{vendor.review_source === "happy_moments" ? " on Happy Moments" : ""})
                </span>
              </span>
            ) : (
              <span className="text-[#7D6B71]">No reviews yet</span>
            )}
          </p>
        </div>

        {/* Quick facts: only those the vendor actually has. */}
        {(vendor.events_done || experience) && (
          <dl className="grid grid-cols-2 gap-2">
            {vendor.events_done ? (
              <div className="rounded-2xl bg-[#FFF8EC] px-3 py-2 ring-1 ring-[#F0DFC0]">
                <dt className="text-[11px] text-[#7D6B71]">Events done</dt>
                <dd className="font-['Lora',serif] text-[17px] font-semibold text-[#7A1F3D]">{formatCount(vendor.events_done)}+</dd>
              </div>
            ) : null}
            {experience ? (
              <div className="rounded-2xl bg-[#FFF8EC] px-3 py-2 ring-1 ring-[#F0DFC0]">
                <dt className="text-[11px] text-[#7D6B71]">Experience</dt>
                <dd className="font-['Lora',serif] text-[17px] font-semibold text-[#7A1F3D]">{experience}</dd>
              </div>
            ) : null}
          </dl>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-[#FFF3DC] px-2.5 py-0.5 text-[11px] font-medium text-[#7A4E0E] ring-1 ring-[#EFD9AE]">{t}</span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-1">
          <p className="text-[11px] text-[#7D6B71]">Price range</p>
          <p className="text-[15px] font-semibold text-[#5A1E33]">
            {low ? (high ? `${formatPrice(low)} – ${formatPrice(high)}` : `From ${formatPrice(low)}`) : "Price on request"}
          </p>
          <p className="text-[11px] text-[#7D6B71]">
            Final quote depends on your event{vendorShared ? " · Events and experience shared by the vendor" : ""}
          </p>
        </div>

        <button onClick={() => onRequestQuote(vendor)} disabled={busy}
          aria-describedby={`hm-connect-${vendor.service}-${vendor.vendor_id}`}
          className="mt-1 rounded-2xl bg-[#7A1F3D] py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#661833] active:scale-[.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A63A] focus-visible:ring-offset-2 disabled:opacity-60">
          {busy ? "Opening your group chat…" : "💬 Connect"}
        </button>
        <p id={`hm-connect-${vendor.service}-${vendor.vendor_id}`} className="-mt-1 text-center text-[11px] leading-snug text-[#7D6B71]">
          Starts a group chat with {vendor.brand_name} and the Happy Moments team. Ask for a quote there.
        </p>
        <Link to={`/vendor/${vendor.vendor_id}`} className="text-center text-xs font-medium text-[#7A1F3D] underline-offset-2 hover:underline">
          View their work
        </Link>
      </div>
    </article>
  );
};

export default MatchCard;
