// The customer's digital invite, made from their card answers. An envelope opens,
// the invite slides out with a chime, Momo dances, and they can save it as an
// image or share it. Never shows the phone number or the budget.
//
// Drawn with plain CSS borders, gradients and inline SVG (no CSS transforms on the
// card) so "Save as image" (html2canvas) reproduces it faithfully.

import React, { useEffect, useRef, useState } from "react";
import { MomoBuddy } from "@/components/enquiry/MomoBuddy";
import { EVENT_TYPES } from "@/services/enquiryService";
import { momoSound } from "@/utils/momoSoundEffects";

type Props = {
  eventType: string;
  firstName: string;
  date: string | null; // yyyy-mm-dd
  area: string;
  city: string;
  onSeeMatches: () => void;
  matchesReady: boolean;
};

const prettyDate = (d: string | null) => {
  if (!d) return { day: "", rest: "Date coming soon" };
  const dt = new Date(`${d}T00:00:00`);
  return {
    day: dt.toLocaleDateString("en-IN", { weekday: "long" }),
    rest: dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
  };
};

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const DigitalInvite: React.FC<Props> = ({ eventType, firstName, date, area, city, onSeeMatches, matchesReady }) => {
  const [opened, setOpened] = useState(reducedMotion());
  const [busy, setBusy] = useState<"" | "save" | "share">("");
  const [note, setNote] = useState("");
  const [beat, setBeat] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (opened) return;
    const t = setTimeout(() => {
      setOpened(true);
      momoSound.playCuteGiggle();
    }, 1500);
    return () => clearTimeout(t);
  }, [opened]);

  const emoji = EVENT_TYPES.find((e) => e.key === eventType)?.emoji || "🎉";
  const when = prettyDate(date);
  const place = [area, city].filter(Boolean).join(", ");
  const heading = firstName ? `${firstName}'s ${eventType}` : eventType;
  const shareText =
    `💌 ${heading}\n${date ? `${when.day}, ${when.rest}` : when.rest}${place ? `\n📍 ${place}` : ""}\n\nPlanned with Happy Moments ✨ ${window.location.origin}`;

  const toPng = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const { default: html2canvas } = await import("html2canvas"); // loaded only when needed
    const canvas = await html2canvas(cardRef.current, {
      scale: 2, backgroundColor: null, useCORS: true, logging: false,
      // The copy html2canvas draws would replay animations from their first frame: freeze them.
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
    momoSound.playBubblePop();
    setBusy("save"); setNote("");
    try {
      const blob = await toPng();
      if (!blob) throw new Error();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setNote("Saved! Check your downloads.");
      momoSound.playCelebrationChime();
    } catch {
      setNote("Couldn't make the image. A screenshot works too!");
    } finally {
      setBusy("");
    }
  };

  const share = async () => {
    momoSound.playBubblePop();
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

  const danceAgain = () => {
    setBeat((b) => b + 1);
    momoSound.playCuteGiggle();
  };

  return (
    <section className="mx-auto flex max-w-md flex-col items-center text-center" aria-labelledby="hm-invite-title">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A8792A]">Your card is ready</p>
      <h1 id="hm-invite-title" className="mt-1 font-['Lora',serif] text-[28px] font-semibold text-[#7A1F3D]">Congratulations{firstName ? `, ${firstName}` : ""}!</h1>

      {/* The stage takes the invite's own height, so the buttons sit right under it. */}
      <div className="hm-stage relative mt-6 w-full max-w-[340px]">
        {/* Envelope */}
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
          <div ref={cardRef}
            className="relative overflow-hidden rounded-[26px] p-2.5 shadow-[0_24px_50px_rgba(122,31,61,0.28)]"
            style={{
              backgroundColor: "#6E1630",
              backgroundImage: "radial-gradient(rgba(232,190,96,0.22) 1.2px, transparent 1.3px)",
              backgroundSize: "14px 14px",
            }}>
            <Toran />

            {/* Arched cream panel */}
            <div className="relative mt-1 rounded-b-[18px] rounded-t-[150px] border-2 border-[#D4A63A] bg-[#FFF8EC] px-5 pb-8 pt-9"
              style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #FFF1D0 0, #FFF8EC 60%)" }}>
              <div className="pointer-events-none absolute inset-[5px] rounded-b-[13px] rounded-t-[145px] border border-dashed border-[#D4A63A]/80" />

              {/* Medallion */}
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-[#D4A63A] bg-[#7A1F3D] text-[26px] shadow-[0_4px_12px_rgba(122,31,61,0.3)]">
                <span aria-hidden>{emoji}</span>
              </div>

              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#A8792A]">You're invited to celebrate</p>
              <p className="mt-1.5 font-['Lora',serif] text-[29px] font-semibold leading-[1.1] text-[#7A1F3D]">{heading}</p>

              <div className="mx-auto my-2.5 flex items-center justify-center gap-2 text-[#D4A63A]" aria-hidden>
                <span className="h-px w-8 bg-current" /><span className="text-[11px]">❀</span><span className="h-px w-8 bg-current" />
              </div>

              {/* Date ribbon (block elements: html2canvas drops text inside inline-block pills) */}
              <div className="flex justify-center">
                <div className="rounded-full bg-[#7A1F3D] px-5 py-1.5 text-center shadow-sm">
                  {when.day && <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#EBCB86" }}>{when.day}</div>}
                  <div className="font-['Lora',serif] text-[15px] font-semibold" style={{ color: "#F6D58A" }}>{when.rest}</div>
                </div>
              </div>
              {place && <p className="mt-2 text-[13px] text-[#6D4A55]">📍 {place}</p>}

              <div className="mt-2 flex items-end justify-center gap-3">
                <Diya />
                <MomoBuddy mood="dance" beat={beat} size={66} />
                <Diya />
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <img src="/logo.jpg" alt="" className="h-5 w-5 rounded-full object-cover ring-1 ring-[#D4A63A]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A1F3D]">Planned with Happy Moments</p>
              </div>
              <Rangoli className="left-1.5 bottom-1.5" />
              <Rangoli className="right-1.5 bottom-1.5" />
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-5 grid w-full max-w-[340px] gap-2.5 transition-opacity duration-500 ${opened ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <button onClick={() => { momoSound.playBubblePop(); onSeeMatches(); }} className={`${btn} bg-[#7A1F3D] text-white hover:bg-[#661833]`}>
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
        <button onClick={danceAgain} className="text-xs font-medium text-[#7A1F3D] underline-offset-2 hover:underline">
          💃 Make Momo dance again
        </button>
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
          .hm-diya-flame { animation: hmFlicker 1.4s ease-in-out infinite; transform-origin: 50% 100%; }
        }
        @keyframes hmWiggle { 0%,100% { transform: none; } 20% { transform: rotate(-3deg); } 40% { transform: rotate(3deg); } 60% { transform: rotate(-2deg); } }
        @keyframes hmFlicker { 0%,100% { transform: scale(1, 1); } 50% { transform: scale(.9, 1.12); } }
      `}</style>
    </section>
  );
};

const btn = "rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition active:scale-[.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A63A] focus-visible:ring-offset-2 disabled:opacity-60";

// Marigold and mango-leaf toran hanging across the top of the card.
const Toran = () => (
  <svg viewBox="0 0 320 44" className="block h-9 w-full" aria-hidden preserveAspectRatio="none">
    <path d="M0 6 Q160 20 320 6" fill="none" stroke="#E9C46A" strokeWidth="1.5" />
    {Array.from({ length: 11 }).map((_, i) => {
      const x = 16 + i * 28.8;
      const y = 6 + 14 * (1 - Math.pow((x - 160) / 160, 2)) * 0.5;
      return (
        <g key={i}>
          <line x1={x} y1={y} x2={x} y2={y + 14} stroke="#E9C46A" strokeWidth="1" />
          <circle cx={x} cy={y + 18} r="5.5" fill={i % 2 ? "#F29E1F" : "#F6C445"} />
          <circle cx={x} cy={y + 18} r="2.2" fill="#C2410C" opacity=".55" />
          {i < 10 && <path d={`M${x + 14} ${y + 2} q4 9 0 16 q-4 -7 0 -16z`} fill="#4E8A3A" />}
        </g>
      );
    })}
  </svg>
);

const Diya = () => (
  <svg viewBox="0 0 30 30" className="mb-1 h-8 w-8" aria-hidden>
    <path className="hm-diya-flame" d="M15 3 C19 9 18 13 15 14 C12 13 11 9 15 3Z" fill="#F6C445" />
    <path d="M15 7 C16.5 10 16 12 15 12.5 C14 12 13.5 10 15 7Z" fill="#F29E1F" />
    <path d="M3 17 H27 C26 24 21 27 15 27 C9 27 4 24 3 17Z" fill="#B45309" />
    <path d="M5 17 H25" stroke="#D4A63A" strokeWidth="2" />
  </svg>
);

// Corner flowers as text characters so they also appear in the saved image.
const Rangoli: React.FC<{ className: string }> = ({ className }) => (
  <span className={`pointer-events-none absolute text-[18px] leading-none ${className}`} style={{ color: "#C9567A" }} aria-hidden>✿</span>
);

export default DigitalInvite;
