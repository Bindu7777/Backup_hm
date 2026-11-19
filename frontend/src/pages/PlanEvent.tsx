// Phase 1 customer journey: greeting-card enquiry (one question per screen, Momo
// reacting along the way) -> digital invite -> honest matches (2 per service)
// -> sign-up gate -> group chat. Works without login until the customer contacts
// a vendor. The enquiry payload is unchanged (see createEnquiry); the mobile number
// typed on the last step only pre-fills the sign-up form and is never stored with
// the enquiry or in the browser.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { momoSound } from "@/utils/momoSoundEffects";
import Header from "@/components/layout/Header";
import SignUpGate from "@/components/enquiry/SignUpGate";
import MatchCard from "@/components/enquiry/MatchCard";
import DigitalInvite from "@/components/enquiry/DigitalInvite";
import { MomoBuddy, momoStyles, type MomoMood } from "@/components/enquiry/MomoBuddy";
import { getMyCustomerProfile, normaliseIndianMobile, useHmSession } from "@/lib/hmAuth";
import {
  BUDGETS, EVENT_TYPES, SERVICES, STYLES, budgetLabel, claimPendingEnquiry, createEnquiry,
  getPendingEnquiry, matchVendors, openChatGroup, serviceLabel, vendorCardStats, vendorPhotosAndLogo,
  type EnquiryAnswers, type VendorMatch,
} from "@/services/enquiryService";

const EMPTY: EnquiryAnswers = {
  event_type: "", event_date: null, city: "Hyderabad", area: "", guests: null,
  budget_range: null, services: [], style_tags: [], notes: "", customer_name: "",
};

const PER_SERVICE = 2;
const HYD_AREAS = ["Gachibowli", "HITEC City", "Madhapur", "Kondapur", "Jubilee Hills", "Banjara Hills",
  "Kukatpally", "Miyapur", "Manikonda", "Secunderabad", "LB Nagar", "Shamshabad"];
const BUDGET_TICKS = ["Not sure", "< 1L", "1–3L", "3–5L", "5–10L", "10L+"];
// Real event photos for the style cards: a Happy Moments stock photo and two
// vendor decor photos. If a photo can't load, the colour pattern behind it shows.
const STYLE_PHOTO: Record<string, string> = {
  traditional: "/images/decor1.jpg",
  modern: supabase.storage.from("vendor-images").getPublicUrl("1040/catalog/sm_events_catalog_1.png").data.publicUrl,
  minimal: supabase.storage.from("vendor-images").getPublicUrl("71/catalog/1773595191403_compressed_1773595191091.jpeg").data.publicUrl,
};
const STYLE_ART: Record<string, string> = {
  traditional: "radial-gradient(circle at 50% 120%, #D4A63A 0 22%, transparent 23%), radial-gradient(circle at 50% 120%, #7A1F3D 0 38%, transparent 39%), repeating-conic-gradient(from 0deg at 50% 120%, #F3C969 0 6deg, #FBE3A6 6deg 12deg)",
  modern: "linear-gradient(135deg, #2B2D42 0 34%, transparent 34%), linear-gradient(45deg, #D4A63A 0 30%, transparent 30%), linear-gradient(180deg, #F2E9E4, #E7D3C6)",
  minimal: "radial-gradient(circle at 70% 35%, #FFFFFF 0 16%, transparent 17%), linear-gradient(180deg, #F7F3EC, #ECE4D6)",
};
const STYLE_LINE: Record<string, string> = {
  traditional: "Marigolds, mandaps, rich colours",
  modern: "Pastels, lights, clean lines",
  minimal: "Whites, greens, quiet elegance",
};

const today = () => new Date().toISOString().slice(0, 10);
const firstName = (n: string) => n.trim().split(/\s+/)[0] || "";

type Phase = "card" | "invite" | "results";

const PlanEvent: React.FC = () => {
  const navigate = useNavigate();
  const session = useHmSession();
  const [answers, setAnswers] = useState<EnquiryAnswers>(EMPTY);
  const [mobile, setMobile] = useState("");
  const [mobileTouched, setMobileTouched] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [phase, setPhase] = useState<Phase>("card");
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [matches, setMatches] = useState<VendorMatch[] | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [gateFor, setGateFor] = useState<VendorMatch | null>(null);
  const [opening, setOpening] = useState<number | null>(null);
  const [momo, setMomo] = useState<{ mood: MomoMood; say: string; beat: number }>({ mood: "wave", say: "", beat: 0 });
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Arrived from a vendor's "Request quote" button: keep that vendor first.
  const [params] = useSearchParams();
  const chosenId = Number(params.get("vendor")) || null;
  const [chosen, setChosen] = useState<VendorMatch | null>(null);

  useEffect(() => {
    if (!chosenId) return;
    supabase
      .from("vendors")
      .select("vendor_id, slug, brand_name, categories, starting_price, quick_intro, caption, verified, catalog_images_metadata")
      .eq("vendor_id", chosenId)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        const [stats, media] = await Promise.all([
          vendorCardStats(data.vendor_id).catch(() => null),
          vendorPhotosAndLogo(data.vendor_id).catch(() => ({ photos: [] as string[], logo: null })),
        ]);
        const photos = media.photos;
        setChosen({
          service: "chosen", vendor_id: data.vendor_id, slug: data.slug, brand_name: data.brand_name,
          area_label: "Hyderabad", categories: data.categories || [], starting_price: data.starting_price || null,
          good_for: (data.quick_intro || data.caption || "").slice(0, 120) || null, verified: Boolean(data.verified), photos, score: 0,
          ...(stats || {}),
          logo: media.logo,
        });
      });
  }, [chosenId]);

  // Signed in (or just signed in): attach a card made while signed out to the account,
  // so it shows up in My celebrations.
  useEffect(() => {
    if (!session) return;
    const pending = getPendingEnquiry();
    if (pending?.claimToken) claimPendingEnquiry(pending).catch(() => undefined);
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Coming back (e.g. after the email sign-in link): restore the saved enquiry.
  useEffect(() => {
    const pending = getPendingEnquiry();
    if (!pending) return;
    // A saved card older than a week: start fresh rather than reuse stale answers.
    if (Date.now() - new Date(pending.savedAt).getTime() > 7 * 24 * 3600 * 1000) return;
    setAnswers(pending.answers);
    setEnquiryId(pending.id);
    setPhase("results");
    matchVendors(pending.answers).then(setMatches).catch(() => setMatches([]));
  }, []);

  // Momo reacts with a move and a little sound (sounds follow the 🔊 switch).
  const react = (mood: MomoMood, say: string) => {
    setMomo((m) => ({ mood, say, beat: m.beat + 1 }));
    if (mood === "bounce") momoSound.playHamsterSqueak();
    else if (mood === "dance" || mood === "celebrate") momoSound.playCuteGiggle();
    else momoSound.playBubblePop();
  };
  const [soundOn, setSoundOn] = useState(() => momoSound.isEnabled());
  useEffect(() => momoSound.subscribe(setSoundOn), []);
  const tapMomo = () => {
    const lines = ["Hehe, that tickles! 🐹", "I'm so excited for your event! 💃", "Let's make it magical ✨", "Nom nom… I mean, next question! 🌸"];
    react("dance", lines[Math.floor(Math.random() * lines.length)]);
  };
  const set = <K extends keyof EnquiryAnswers>(key: K, value: EnquiryAnswers[K]) =>
    setAnswers((a) => ({ ...a, [key]: value }));
  const toggle = (key: "services" | "style_tags", value: string) =>
    setAnswers((a) => ({ ...a, [key]: a[key].includes(value) ? a[key].filter((v) => v !== value) : [...a[key], value] }));

  const go = (to: number) => {
    setDir(to > step ? "next" : "prev");
    setStep(to);
    setError("");
    setMomo((m) => ({ mood: to === 0 ? "wave" : "nod", say: "", beat: m.beat + 1 }));
  };

  // Move focus to the new question so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (phase === "card") headingRef.current?.focus({ preventScroll: true });
  }, [step, phase]);

  const mobileOk = normaliseIndianMobile(mobile) !== null;

  const steps = useMemo(() => [
    {
      title: "What are we celebrating?",
      momo: "Hi! I'm Momo 🐹 Let's make your celebration card together.",
      valid: Boolean(answers.event_type),
      body: (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {EVENT_TYPES.map((e) => (
            <Chip key={e.key} big active={answers.event_type === e.key}
              onClick={() => {
                set("event_type", e.key);
                react("bounce", `Ooh, a ${e.key.split(" / ")[0].toLowerCase()}! I love those ${e.emoji}`);
                setTimeout(() => go(1), 550);
              }}>
              <span className="text-[26px]" aria-hidden>{e.emoji}</span>
              <span className="text-[13px] leading-tight">{e.key}</span>
            </Chip>
          ))}
        </div>
      ),
    },
    {
      title: "When is the big day?",
      momo: "Not fixed yet? No worries, you can skip this.",
      valid: true,
      body: (
        <div className="space-y-3">
          <label className="block">
            <span className="sr-only">Event date</span>
            <input type="date" min={today()} value={answers.event_date || ""}
              onChange={(e) => {
                set("event_date", e.target.value || null);
                if (e.target.value) react("nod", "Marked in my tiny calendar 📅");
              }}
              className={`${fieldInput} py-4 text-lg`} />
          </label>
          <Chip active={!answers.event_date} onClick={() => { set("event_date", null); react("nod", "We'll fill it in later ✨"); }}>
            Not decided yet
          </Chip>
        </div>
      ),
    },
    {
      title: "Where in Hyderabad?",
      momo: "Pick your area, so vendors nearby show up first.",
      valid: answers.city.trim().length > 1,
      body: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {HYD_AREAS.map((a) => (
              <Chip key={a} active={answers.area === a}
                onClick={() => {
                  const next = answers.area === a ? "" : a;
                  set("area", next);
                  if (next) react("nod", `${a}, lovely spot! 📍`);
                }}>
                {a}
              </Chip>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Another area">
              <input className={fieldInput} value={HYD_AREAS.includes(answers.area) ? "" : answers.area}
                placeholder="e.g. Nallagandla" onChange={(e) => set("area", e.target.value)} />
            </Field>
            <Field label="City">
              <input className={fieldInput} value={answers.city} autoComplete="address-level2" onChange={(e) => set("city", e.target.value)} />
            </Field>
          </div>
        </div>
      ),
    },
    {
      title: "How many guests?",
      momo: "A rough number is perfect.",
      valid: true,
      body: (
        <div className="space-y-4">
          <p className="text-center font-['Lora',serif] text-4xl font-semibold text-[#7A1F3D]" aria-hidden>
            {answers.guests ? (answers.guests >= 1000 ? "1000+" : `~${answers.guests}`) : "–"}
            <span className="ml-2 font-sans text-base font-normal text-[#6D4A55]">guests</span>
          </p>
          <input type="range" min={10} max={1000} step={10} value={answers.guests ?? 150}
            aria-label="Number of guests"
            aria-valuetext={answers.guests ? `about ${answers.guests} guests` : "not chosen"}
            onChange={(e) => set("guests", Number(e.target.value))}
            onPointerUp={() => answers.guests && react("nod", answers.guests >= 400 ? "A grand celebration! 🎉" : answers.guests <= 60 ? "Cosy and special 💛" : "Lovely crowd! 🥳")}
            onKeyUp={() => answers.guests && react("nod", "Got it 👍")}
            className="hm-range w-full" />
          <div className="flex justify-between text-xs text-[#6D4A55]" aria-hidden><span>10</span><span>250</span><span>500</span><span>750</span><span>1000+</span></div>
          <Chip active={answers.guests === null} onClick={() => set("guests", null)}>Not sure yet</Chip>
        </div>
      ),
    },
    {
      title: "What's your budget?",
      momo: "For the whole event. Only you and your vendors see it.",
      valid: true,
      body: (() => {
        const idx = answers.budget_range ? BUDGETS.findIndex((b) => b.key === answers.budget_range) + 1 : 0;
        return (
          <div className="space-y-4">
            <p className="text-center font-['Lora',serif] text-3xl font-semibold text-[#7A1F3D]">{idx === 0 ? "Not decided" : budgetLabel(answers.budget_range)}</p>
            <input type="range" min={0} max={BUDGETS.length} step={1} value={idx}
              aria-label="Budget"
              aria-valuetext={idx === 0 ? "Not decided" : budgetLabel(answers.budget_range)}
              onChange={(e) => {
                const i = Number(e.target.value);
                set("budget_range", i === 0 ? null : BUDGETS[i - 1].key);
              }}
              onPointerUp={() => react("nod", "Noted, I'll find vendors who fit 💰")}
              className="hm-range w-full" />
            <div className="grid grid-cols-6 text-center text-[11px] text-[#6D4A55]" aria-hidden>
              {BUDGET_TICKS.map((t) => <span key={t}>{t}</span>)}
            </div>
          </div>
        );
      })(),
    },
    {
      title: "Which services do you need?",
      momo: "Pick as many as you like!",
      valid: answers.services.length > 0,
      body: (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {SERVICES.map((s) => {
            const on = answers.services.includes(s.key);
            return (
              <Chip key={s.key} big active={on}
                onClick={() => { toggle("services", s.key); react(on ? "nod" : "bounce", on ? `Removed ${s.label}` : `${s.label}, added! ${s.emoji}`); }}>
                <span className="text-[26px]" aria-hidden>{s.emoji}</span>
                <span className="text-[13px] leading-tight">{s.label}</span>
              </Chip>
            );
          })}
        </div>
      ),
    },
    {
      title: "Which style feels like you?",
      momo: "Choose one or mix them, it's your day.",
      valid: true,
      body: (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {STYLES.map((s) => {
            const on = answers.style_tags.includes(s.key);
            return (
              <button key={s.key} type="button" aria-pressed={on}
                onClick={() => { toggle("style_tags", s.key); if (!on) react("bounce", `${s.label} it is ${s.emoji}`); }}
                className={`${pressable} overflow-hidden rounded-2xl bg-white text-left ${on ? "ring-[3px] ring-[#7A1F3D]" : "ring-1 ring-[#E8D3AE]"}`}>
                <span className="relative block aspect-[4/5] w-full overflow-hidden" style={{ backgroundImage: STYLE_ART[s.key] }} aria-hidden>
                  <img src={STYLE_PHOTO[s.key]} alt="" loading="lazy" decoding="async"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${on ? "scale-105" : ""}`} />
                  <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute inset-x-2 bottom-2 text-[10px] font-medium leading-tight text-white/95 sm:text-[11px]">{STYLE_LINE[s.key]}</span>
                  {on && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#7A1F3D] text-xs text-white ring-2 ring-white">✓</span>}
                </span>
                <span className="flex items-center justify-between gap-1 px-2.5 py-2 text-[13px] font-semibold text-[#5A1E33]">
                  {s.label} <span aria-hidden>{s.emoji}</span>
                </span>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "Who's this card for?",
      momo: "Last one! Your vendors will say hi by name.",
      valid: answers.customer_name.trim().length >= 2 && mobileOk,
      body: (
        <div className="space-y-3">
          <Field label="Your name">
            <input className={fieldInput} value={answers.customer_name} autoComplete="name" maxLength={80}
              onChange={(e) => set("customer_name", e.target.value)} />
          </Field>
          <Field label="Mobile number">
            <div className="flex">
              <span className="grid place-items-center rounded-l-xl border border-r-0 border-[#E3CFA8] bg-[#FFF3DC] px-3 text-[15px] text-[#5A1E33]">+91</span>
              <input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14}
                className={`${fieldInput} rounded-l-none`} value={mobile} placeholder="98765 43210"
                aria-invalid={mobileTouched && !mobileOk} aria-describedby="hm-mobile-help"
                onBlur={() => setMobileTouched(true)}
                onChange={(e) => setMobile(e.target.value.replace(/[^\d\s+-]/g, ""))} />
            </div>
            <span id="hm-mobile-help" className={`mt-1 block text-xs ${mobileTouched && !mobileOk ? "text-rose-700" : "text-[#6D4A55]"}`}>
              {mobileTouched && !mobileOk ? "Enter a 10-digit Indian mobile number." : "Never shown to vendors. We use it only for your account."}
            </span>
          </Field>
          <Field label="A note for vendors (optional)">
            <textarea rows={2} maxLength={2000} className={fieldInput} value={answers.notes}
              placeholder="Theme ideas, timings, must-haves…" onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [answers, mobile, mobileTouched, mobileOk]);

  const current = steps[step];
  const last = step === steps.length - 1;

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const pending = await createEnquiry(answers);
      setEnquiryId(pending.id);
      setPhase("invite");
      momoSound.playCelebrationChime();
      window.scrollTo({ top: 0 });
      matchVendors(answers).then(setMatches).catch(() => setMatches([]));
    } catch (e: any) {
      setError(e?.message || "We couldn't save your card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Contact a vendor: sign-up gate first, then attach the enquiry and open the group.
  const contact = async (vendor: VendorMatch) => {
    if (!session) return setGateFor(vendor);
    const profile = await getMyCustomerProfile().catch(() => null);
    if (!profile) return setGateFor(vendor);
    await openGroup(vendor);
  };

  const openGroup = async (vendor: VendorMatch) => {
    setOpening(vendor.vendor_id);
    setError("");
    try {
      const pending = getPendingEnquiry();
      if (pending && pending.id === enquiryId && pending.claimToken) await claimPendingEnquiry(pending);
      const groupId = await openChatGroup(enquiryId!, vendor.vendor_id);
      navigate(`/chat/${groupId}`);
    } catch (e: any) {
      setError(e?.message || "We couldn't open the chat. Please try again.");
    } finally {
      setOpening(null);
    }
  };

  const startOver = () => {
    try { localStorage.removeItem("hm_pending_enquiry"); } catch { /* ignore */ }
    setAnswers(EMPTY); setMobile(""); setMobileTouched(false); setStep(0); setPhase("card");
    setMatches(null); setEnquiryId(null); setMomo({ mood: "wave", say: "", beat: 0 });
  };

  const grouped = useMemo(() => {
    const out: Record<string, VendorMatch[]> = {};
    for (const m of matches || []) {
      const list = (out[m.service] ||= []);
      if (list.length < PER_SERVICE) list.push(m);
    }
    return out;
  }, [matches]);

  return (
    <div className="min-h-screen bg-[#FFF8EC] font-sans text-[#3D2A30]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-[104px] sm:pt-32">
        {phase === "card" && (
          <section className="mx-auto max-w-xl">
            <div className="relative overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(122,31,61,0.10)] ring-1 ring-[#F0DFC0]">
              <Garland />
              <div className="px-4 pb-5 pt-2 sm:px-9 sm:pb-8">
                <PetalPath step={step} total={steps.length} />

                {chosen && (
                  <p className="mt-3 rounded-2xl bg-[#FFF3DC] px-4 py-2.5 text-[13px] text-[#6A4310]">
                    We'll send your card to <strong>{chosen.brand_name}</strong>, plus a few other good matches.
                  </p>
                )}

                <div className="mt-3 flex items-start justify-between gap-2">
                  <MomoBuddy className="min-h-[76px]" size={62} mood={momo.mood} beat={momo.beat} say={momo.say || current.momo} onTap={tapMomo} />
                  <button type="button" onClick={() => momoSound.toggleSound()} aria-pressed={soundOn}
                    aria-label={soundOn ? "Mute Momo's sounds" : "Turn on Momo's sounds"}
                    className={`${pressable} grid h-9 w-9 shrink-0 place-items-center rounded-full text-base ring-1 ring-[#EAD7B7] hover:bg-[#FFF3DC]`}>
                    <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span>
                  </button>
                </div>

                <div key={step} className={`hm-step-${dir} mt-2`}>
                  <h1 ref={headingRef} tabIndex={-1} className="mb-4 font-['Lora',serif] text-[26px] font-semibold leading-tight text-[#7A1F3D] outline-none sm:text-3xl">
                    {current.title}
                  </h1>
                  {current.body}
                </div>

                {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

                <div className="mt-7 flex items-center justify-between gap-3">
                  <button onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}
                    className={`${pressable} rounded-2xl px-4 py-3 text-sm font-semibold text-[#7A1F3D] hover:bg-[#FFF3DC] disabled:invisible`}>
                    ← Back
                  </button>
                  <button onClick={() => { momoSound.playBubblePop(); if (last) submit(); else go(step + 1); }} disabled={!current.valid || saving}
                    className={`${pressable} rounded-2xl bg-[#7A1F3D] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(122,31,61,0.25)] hover:bg-[#661833] disabled:opacity-40 disabled:shadow-none`}>
                    {last ? (saving ? "Sealing your card…" : "Make my card 💌") : "Next →"}
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-[#6D4A55]">
              No login needed to see your matches.{" "}
              {session
                ? <Link to="/my-celebrations" className="font-semibold text-[#7A1F3D] underline">My celebrations</Link>
                : <>Have an account? <Link to="/my-celebrations" className="font-semibold text-[#7A1F3D] underline">Sign in</Link></>}
            </p>
          </section>
        )}

        {phase === "invite" && (
          <>
            <Petals />
            <DigitalInvite
              eventType={answers.event_type}
              firstName={firstName(answers.customer_name)}
              date={answers.event_date}
              area={answers.area}
              city={answers.city}
              matchesReady={matches !== null}
              onSeeMatches={() => { setPhase("results"); window.scrollTo({ top: 0 }); }}
            />
          </>
        )}

        {phase === "results" && (
          <section>
            <div className="mb-7 flex flex-col gap-3 rounded-3xl bg-white p-5 ring-1 ring-[#F0DFC0] sm:flex-row sm:items-center sm:p-6">
              <MomoBuddy size={58} mood="dance" beat={1} onTap={() => momoSound.playCuteGiggle()} />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A8792A]">Picked for you</p>
                <h1 className="mt-0.5 font-['Lora',serif] text-[26px] font-semibold text-[#7A1F3D] sm:text-3xl">Your top matches</h1>
                <p className="mt-1 text-sm text-[#5A4A50]">
                  {answers.event_type}
                  {answers.event_date ? ` · ${new Date(`${answers.event_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                  {` · ${answers.area ? `${answers.area}, ` : ""}${answers.city}`}
                  {answers.guests ? ` · ~${answers.guests} guests` : ""}
                  {` · ${budgetLabel(answers.budget_range)}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 self-start text-sm font-medium sm:self-center">
                <button onClick={startOver} className="text-[#7A1F3D] underline">Start a new card</button>
                {session && <Link to="/my-celebrations" className="text-[#7A1F3D] underline">My celebrations</Link>}
              </div>
            </div>

            {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

            {chosen && (
              <div className="mb-10">
                <h2 className="mb-3 font-['Lora',serif] text-xl font-semibold text-[#7A1F3D]">The vendor you picked</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <MatchCard vendor={chosen} busy={opening === chosen.vendor_id} onRequestQuote={contact} />
                </div>
              </div>
            )}

            {answers.services.map((service) => {
              const list = grouped[service] || [];
              const emoji = SERVICES.find((s) => s.key === service)?.emoji;
              return (
                <div key={service} className="mb-10">
                  <h2 className="mb-3 font-['Lora',serif] text-xl font-semibold text-[#7A1F3D]">
                    <span aria-hidden>{emoji} </span>{serviceLabel(service)}
                  </h2>
                  {matches === null ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {[0, 1].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-[#F6E9D2] motion-reduce:animate-none" />)}
                    </div>
                  ) : list.length === 0 ? (
                    <div className="flex items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-[#F0DFC0]">
                      <MomoBuddy size={54} mood="nod" beat={0} />
                      <div>
                        <p className="font-['Lora',serif] text-lg font-semibold text-[#7A1F3D]">We're finding the best for you</p>
                        <p className="mt-0.5 text-sm text-[#5A4A50]">
                          Our team is hand-picking {serviceLabel(service).toLowerCase()} vendors for your {answers.event_type.toLowerCase()}. They'll show up in your chats.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((v) => (
                        <MatchCard key={`${service}-${v.vendor_id}`} vendor={v} busy={opening === v.vendor_id} onRequestQuote={contact} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </main>

      <SignUpGate
        open={Boolean(gateFor)}
        mode="customer"
        defaultName={answers.customer_name}
        defaultMobile={normaliseIndianMobile(mobile) || ""}
        onClose={() => setGateFor(null)}
        onDone={() => {
          const v = gateFor;
          setGateFor(null);
          if (v) openGroup(v);
        }}
      />
      <style>{`
        ${momoStyles}
        @media (prefers-reduced-motion: no-preference) {
          .hm-step-next { animation: hmInRight .38s cubic-bezier(.2,.9,.3,1) both; }
          .hm-step-prev { animation: hmInLeft .38s cubic-bezier(.2,.9,.3,1) both; }
          .hm-petal { animation: hmFall var(--d) var(--w) ease-in forwards; }
          .hm-dot-now { animation: hmPulse 1.6s ease-in-out infinite; }
        }
        @media (prefers-reduced-motion: reduce) { .hm-petals { display: none; } }
        @keyframes hmInRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
        @keyframes hmInLeft { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: none; } }
        @keyframes hmFall { 0% { transform: translateY(-8vh) rotate(0); opacity: 1; } 100% { transform: translateY(95vh) translateX(var(--x)) rotate(420deg); opacity: 0; } }
        @keyframes hmPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }
        .hm-range { -webkit-appearance: none; appearance: none; height: 10px; border-radius: 999px; background: #F3E2C2; accent-color: #7A1F3D; }
        .hm-range::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; border-radius: 50%; background: #7A1F3D; border: 4px solid #F6D58A; box-shadow: 0 3px 8px rgba(122,31,61,.3); cursor: pointer; }
        .hm-range::-moz-range-thumb { width: 26px; height: 26px; border-radius: 50%; background: #7A1F3D; border: 4px solid #F6D58A; cursor: pointer; }
        .hm-range:focus-visible { outline: 3px solid #D4A63A; outline-offset: 4px; }
      `}</style>
    </div>
  );
};

const pressable = "transition active:scale-[.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A63A] focus-visible:ring-offset-2";

const fieldInput =
  "w-full rounded-xl border border-[#E3CFA8] bg-white px-4 py-3 text-[16px] text-[#3D2A30] placeholder:text-[#9C8A8F] focus:outline-none focus:ring-2 focus:ring-[#D4A63A]";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-semibold text-[#5A1E33]">{label}</span>
    {children}
  </label>
);

const Chip: React.FC<{ active: boolean; big?: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, big, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className={`${pressable} flex items-center justify-center gap-1 rounded-2xl text-center font-medium
      ${big ? "min-h-[92px] flex-col px-2 py-3" : "px-4 py-2.5 text-sm"}
      ${active ? "bg-[#7A1F3D] text-white shadow-[0_6px_16px_rgba(122,31,61,0.25)] ring-2 ring-[#F6D58A]" : "bg-[#FFFBF3] text-[#5A1E33] ring-1 ring-[#EAD7B7] hover:bg-[#FFF3DC]"}`}>
    {children}
  </button>
);

// Dotted path of petals instead of a progress bar: done = flower, now = bud, next = dot.
const PetalPath: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div className="flex items-center justify-between gap-3">
    <ol className="flex flex-1 items-center" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <li key={i} className="flex flex-1 items-center last:flex-none">
          <span className={`grid h-6 w-6 shrink-0 place-items-center text-[15px] ${i === step ? "hm-dot-now" : ""}`}>
            {i < step ? "🌸" : i === step ? "🌼" : <span className="h-2 w-2 rounded-full bg-[#E6CF9F]" />}
          </span>
          {i < total - 1 && <span className={`mx-0.5 h-0 flex-1 border-t-2 border-dotted ${i < step ? "border-[#C9567A]" : "border-[#E6CF9F]"}`} />}
        </li>
      ))}
    </ol>
    <span className="shrink-0 text-xs font-semibold text-[#8A5A12]">{step + 1}/{total}<span className="sr-only"> questions</span></span>
  </div>
);

// A marigold garland across the top of the card.
const Garland = () => (
  <svg viewBox="0 0 600 40" className="h-7 w-full" aria-hidden preserveAspectRatio="none">
    <path d="M0 4 Q150 36 300 4 Q450 36 600 4" fill="none" stroke="#D4A63A" strokeWidth="1.5" />
    {Array.from({ length: 13 }).map((_, i) => {
      const x = i * 50;
      const t = (x % 300) / 300;
      const y = 4 + 64 * t * (1 - t);
      return <circle key={i} cx={x} cy={y} r="5" fill={i % 3 === 0 ? "#7A1F3D" : i % 2 ? "#F29E1F" : "#F6C445"} />;
    })}
  </svg>
);

const Petals = () => (
  <div className="hm-petals pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
    {Array.from({ length: 22 }).map((_, i) => (
      <span key={i} className="hm-petal absolute -top-6 block h-3 w-2.5 rounded-[60%_0_60%_0] opacity-0"
        style={{
          left: `${(i * 41) % 100}%`,
          background: ["#C9567A", "#F6C445", "#F29E1F", "#E88FA8"][i % 4],
          ["--d" as any]: `${2.4 + (i % 5) * 0.5}s`,
          ["--w" as any]: `${(i % 8) * 0.18}s`,
          ["--x" as any]: `${(i % 2 ? 1 : -1) * (20 + (i % 4) * 15)}px`,
        }} />
    ))}
  </div>
);

export default PlanEvent;
