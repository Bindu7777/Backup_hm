// The customer's digital invite, made from their card answers. An envelope opens,
// the invite slides out, and they can save it as an image or share it.
// Never shows the phone number or the budget.

import React, { useEffect, useRef, useState } from "react";
import { MomoBuddy } from "@/components/enquiry/MomoBuddy";

type Props = {
  eventType: string;
  firstName: string;
  date: string | null; // yyyy-mm-dd
  area: string;
  city: string;
  onSeeMatches: () => void;
  matchesReady: boolean;
};

const prettyDate = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Date coming soon";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const DigitalInvite: React.FC<Props> = ({ eventType, firstName, date, area, city, onSeeMatches, matchesReady }) => {
  const [opened, setOpened] = useState(reducedMotion());
  const [busy, setBusy] = useState<"" | "save" | "share">("");
  const [note, setNote] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (opened) return;
    const t = setTimeout(() => setOpened(true), 1500);
    return () => clearTimeout(t);
  }, [opened]);

  const place = [area, city].filter(Boolean).join(", ");
  const heading = firstName ? `${firstName}'s ${eventType}` : eventType;
  const shareText =
    `💌 ${heading}\n${prettyDate(date)}${place ? `\n📍 ${place}` : ""}\n\nPlanned with Happy Moments ✨ ${window.location.origin}`;

  const toPng = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const { default: html2canvas } = await import("html2canvas"); // loaded only when needed
    const canvas = await html2canvas(cardRef.current, {
      scale: 2, backgroundColor: null, useCORS: true, logging: false,
      // The copy html2canvas draws would replay Momo's fade-in from invisible: freeze it.
      onclone: (doc) => {
        const style = doc.createElement("style");
        style.textContent = "*{animation:none!important;transition:none!important}";
        doc.head.appendChild(style);
      },
    });
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  };

  const fileName = `happy-moments-${eventType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;

  const save = async () => {
    setBusy("save"); setNote("");
    try {
      const blob = await toPng();
      if (!blob) throw new Error();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setNote("Saved! Check your downloads.");
    } catch {
      setNote("Couldn't make the image. A screenshot works too!");
    } finally {
      setBusy("");
    }
  };

  const share = async () => {
    setBusy("share"); setNote("");
    try {
      if (navigator.share) {
        const blob = await toPng().catch(() => null);
        const file = blob ? new File([blob], fileName, { type: "image/png" }) : null;
        if (file && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: shareText });
        } else {
          await navigator.share({ text: shareText });
        }
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="mx-auto flex max-w-md flex-col items-center text-center" aria-labelledby="hm-invite-title">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A8792A]">Your card is ready</p>
      <h1 id="hm-invite-title" className="mt-1 font-['Lora',serif] text-[28px] font-semibold text-[#7A1F3D]">Congratulations{firstName ? `, ${firstName}` : ""}!</h1>

      {/* The stage takes the invite's own height, so the buttons sit right under it. */}
      <div className="hm-stage relative mt-6 w-full max-w-[340px]">
        {/* Envelope back + front pocket */}
        <div className={`hm-env absolute inset-x-0 bottom-0 z-0 h-[210px] ${opened ? "hm-env-done" : ""}`} aria-hidden>
          <div className="absolute inset-0 rounded-2xl bg-[#8C2A4A] shadow-[0_18px_40px_rgba(122,31,61,0.25)]" />
          <div className={`hm-flap absolute inset-x-0 top-0 h-[120px] origin-top ${opened ? "hm-flap-open" : ""}`}>
            <svg viewBox="0 0 340 120" className="h-full w-full" preserveAspectRatio="none">
              <path d="M0 0 H340 L170 112 Z" fill="#A23B5E" />
            </svg>
            <span className="absolute left-1/2 top-[78px] grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-[#D4A63A] text-sm text-[#7A1F3D] shadow">HM</span>
          </div>
        </div>

        {/* The invite itself */}
        <div className={`hm-card relative z-10 mx-auto w-full ${opened ? "hm-card-out" : ""}`}>
          <div ref={cardRef} className="relative overflow-hidden rounded-[22px] bg-[#FFF8EC] p-3 shadow-[0_24px_50px_rgba(122,31,61,0.18)]">
            <div className="relative rounded-[16px] border-2 border-[#D4A63A] px-5 pb-5 pt-6">
              <div className="pointer-events-none absolute inset-1.5 rounded-[12px] border border-dashed border-[#D4A63A]/70" />
              <Corner className="left-1 top-1 rounded-tl-[14px] border-l-2 border-t-2" />
              <Corner className="right-1 top-1 rounded-tr-[14px] border-r-2 border-t-2" />
              <Corner className="bottom-1 right-1 rounded-br-[14px] border-b-2 border-r-2" />
              <Corner className="bottom-1 left-1 rounded-bl-[14px] border-b-2 border-l-2" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A8792A]">Save the date</p>
              <p className="mt-2 font-['Lora',serif] text-[30px] font-semibold leading-tight text-[#7A1F3D]">{heading}</p>
              <div className="mx-auto my-3 flex items-center justify-center gap-2 text-[#D4A63A]" aria-hidden>
                <span className="h-px w-10 bg-current" />✿<span className="h-px w-10 bg-current" />
              </div>
              <p className="font-['Lora',serif] text-[16px] text-[#5A1E33]">{prettyDate(date)}</p>
              {place && <p className="mt-1 text-[14px] text-[#6D4A55]">📍 {place}</p>}

              <div className="mt-4 flex items-end justify-center">
                <MomoBuddy mood="wave" beat={0} size={70} />
              </div>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A1F3D]">Planned with Happy Moments</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-5 grid w-full max-w-[340px] gap-2.5 transition-opacity duration-500 ${opened ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <button onClick={onSeeMatches} className={`${btn} bg-[#7A1F3D] text-white hover:bg-[#661833]`}>
          {matchesReady ? "See my matches →" : "Finding your matches…"}
        </button>
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={save} disabled={busy !== ""} className={`${btn} bg-white px-2 text-[13px] text-[#7A1F3D] ring-1 ring-[#E3CFA8] hover:bg-[#FFF3DC]`}>
            {busy === "save" ? "Saving…" : "⬇ Save as image"}
          </button>
          <button onClick={share} disabled={busy !== ""} className={`${btn} bg-[#1F7A4A] px-2 text-[13px] text-white hover:bg-[#186B40]`}>
            {busy === "share" ? "Opening…" : "Share on WhatsApp"}
          </button>
        </div>
        <p className="min-h-[1.25rem] text-xs text-[#6D4A55]" aria-live="polite">{note}</p>
      </div>

      <style>{`
        .hm-card { transform: translateY(90px) scale(.8); opacity: 0; }
        .hm-card-out { transform: none; opacity: 1; }
        .hm-env-done { opacity: 0; transform: translateY(30px); }
        .hm-flap-open { transform: rotateX(180deg); }
        @media (prefers-reduced-motion: no-preference) {
          .hm-card { transition: transform .8s cubic-bezier(.2,1.2,.4,1) .35s, opacity .3s ease .35s; }
          .hm-flap { transition: transform .5s ease-in; }
          .hm-env { transition: opacity .5s ease .9s, transform .5s ease .9s; }
          .hm-stage:not(:has(.hm-card-out)) .hm-env { animation: hmWiggle 1.2s ease-in-out .1s; }
        }
        @keyframes hmWiggle { 0%,100% { transform: none; } 20% { transform: rotate(-3deg); } 40% { transform: rotate(3deg); } 60% { transform: rotate(-2deg); } }
      `}</style>
    </section>
  );
};

const btn = "rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition active:scale-[.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A63A] focus-visible:ring-offset-2 disabled:opacity-60";

// Plain CSS borders (not SVG/transform) so "Save as image" draws all four corners.
const Corner: React.FC<{ className: string }> = ({ className }) => (
  <span className={`pointer-events-none absolute h-6 w-6 border-[#B8862A] ${className}`} aria-hidden />
);

export default DigitalInvite;
