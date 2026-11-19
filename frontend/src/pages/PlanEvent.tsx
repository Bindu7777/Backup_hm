// Phase 1 customer journey: greeting-card enquiry -> honest matches -> sign-up gate
// -> group chat. Works without login until the customer contacts a vendor.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import SignUpGate from "@/components/enquiry/SignUpGate";
import MatchCard from "@/components/enquiry/MatchCard";
import { getMyCustomerProfile, useHmSession } from "@/lib/hmAuth";
import {
  BUDGETS, EVENT_TYPES, SERVICES, STYLES, budgetLabel, claimPendingEnquiry, createEnquiry,
  getPendingEnquiry, matchVendors, openChatGroup, serviceLabel,
  type EnquiryAnswers, type VendorMatch,
} from "@/services/enquiryService";

const EMPTY: EnquiryAnswers = {
  event_type: "", event_date: null, city: "Hyderabad", area: "", guests: null,
  budget_range: null, services: [], style_tags: [], notes: "", customer_name: "",
};

const GUEST_PRESETS = [50, 100, 200, 400, 800];
const today = () => new Date().toISOString().slice(0, 10);

type Phase = "card" | "celebrate" | "results";

const PlanEvent: React.FC = () => {
  const navigate = useNavigate();
  const session = useHmSession();
  const [answers, setAnswers] = useState<EnquiryAnswers>(EMPTY);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("card");
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [matches, setMatches] = useState<VendorMatch[] | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [gateFor, setGateFor] = useState<VendorMatch | null>(null);
  const [opening, setOpening] = useState<number | null>(null);
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
      .then(({ data }) => {
        if (!data) return;
        const photos = Array.isArray(data.catalog_images_metadata)
          ? data.catalog_images_metadata.map((m: any) => m?.media_url).filter(Boolean).slice(0, 4)
          : [];
        setChosen({
          service: "chosen", vendor_id: data.vendor_id, slug: data.slug, brand_name: data.brand_name,
          area_label: "Hyderabad", categories: data.categories || [], starting_price: data.starting_price || null,
          good_for: (data.quick_intro || data.caption || "").slice(0, 120) || null, verified: Boolean(data.verified), photos, score: 0,
        });
      });
  }, [chosenId]);

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

  const set = <K extends keyof EnquiryAnswers>(key: K, value: EnquiryAnswers[K]) =>
    setAnswers((a) => ({ ...a, [key]: value }));
  const toggle = (key: "services" | "style_tags", value: string) =>
    setAnswers((a) => ({ ...a, [key]: a[key].includes(value) ? a[key].filter((v) => v !== value) : [...a[key], value] }));

  const steps = useMemo(() => [
    {
      title: "What are we celebrating?",
      valid: Boolean(answers.event_type),
      body: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {EVENT_TYPES.map((e) => (
            <Choice key={e.key} active={answers.event_type === e.key} onClick={() => { set("event_type", e.key); setTimeout(() => setStep(1), 180); }}>
              <span className="text-2xl" aria-hidden>{e.emoji}</span>
              <span className="text-sm">{e.key}</span>
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: "When is the big day?",
      valid: true,
      hint: "Not fixed yet? Skip it, vendors can still help.",
      body: (
        <input type="date" min={today()} value={answers.event_date || ""} onChange={(e) => set("event_date", e.target.value || null)}
          className="w-full rounded-2xl border border-[#E8D9B8] bg-white px-4 py-4 text-lg text-[#1D3C6A] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
      ),
    },
    {
      title: "Where will it happen?",
      valid: answers.city.trim().length > 1,
      body: (
        <div className="space-y-3">
          <Field label="City">
            <input className={fieldInput} value={answers.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Area (optional)">
            <input className={fieldInput} value={answers.area} placeholder="e.g. Gachibowli, Kukatpally" onChange={(e) => set("area", e.target.value)} />
          </Field>
        </div>
      ),
    },
    {
      title: "How many guests?",
      valid: true,
      hint: "A rough number is fine.",
      body: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {GUEST_PRESETS.map((g) => (
              <Choice key={g} compact active={answers.guests === g} onClick={() => set("guests", g)}>
                {g === 800 ? "800+" : `~${g}`}
              </Choice>
            ))}
          </div>
          <Field label="Or type a number">
            <input type="number" min={1} max={100000} className={fieldInput} value={answers.guests ?? ""}
              onChange={(e) => set("guests", e.target.value ? Math.max(1, Math.min(100000, Number(e.target.value))) : null)} />
          </Field>
        </div>
      ),
    },
    {
      title: "What's your budget?",
      valid: true,
      hint: "For the whole event. It helps us pick the right vendors.",
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {BUDGETS.map((b) => (
            <Choice key={b.key} active={answers.budget_range === b.key} onClick={() => set("budget_range", answers.budget_range === b.key ? null : b.key)}>
              <span className="text-sm">{b.label}</span>
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: "Which services do you need?",
      valid: answers.services.length > 0,
      hint: "Pick as many as you like.",
      body: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SERVICES.map((s) => (
            <Choice key={s.key} active={answers.services.includes(s.key)} onClick={() => toggle("services", s.key)}>
              <span className="text-2xl" aria-hidden>{s.emoji}</span>
              <span className="text-sm">{s.label}</span>
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: "What style feels like you?",
      valid: true,
      body: (
        <div className="grid grid-cols-3 gap-3">
          {STYLES.map((s) => (
            <Choice key={s.key} active={answers.style_tags.includes(s.key)} onClick={() => toggle("style_tags", s.key)}>
              <span className="text-2xl" aria-hidden>{s.emoji}</span>
              <span className="text-sm">{s.label}</span>
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: "Anything else we should know?",
      valid: true,
      body: (
        <div className="space-y-3">
          <Field label="Your name (optional)">
            <input className={fieldInput} value={answers.customer_name} autoComplete="name" onChange={(e) => set("customer_name", e.target.value)} />
          </Field>
          <Field label="A note for vendors (optional)">
            <textarea rows={3} maxLength={2000} className={fieldInput} value={answers.notes}
              placeholder="Theme ideas, timings, must-haves…" onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [answers]);

  const current = steps[step];
  const last = step === steps.length - 1;

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const pending = await createEnquiry(answers);
      setEnquiryId(pending.id);
      setPhase("celebrate");
      const [found] = await Promise.all([matchVendors(answers), new Promise((r) => setTimeout(r, 1600))]);
      setMatches(found);
      setPhase("results");
    } catch (e: any) {
      setError(e?.message || "We couldn't save your card. Please try again.");
      setPhase("card");
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
    setAnswers(EMPTY); setStep(0); setPhase("card"); setMatches(null); setEnquiryId(null);
  };

  const grouped = useMemo(() => {
    const out: Record<string, VendorMatch[]> = {};
    for (const m of matches || []) (out[m.service] ||= []).push(m);
    return out;
  }, [matches]);

  return (
    <div className="min-h-screen bg-[#FFF8EC]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:pt-32">
        {phase === "card" && (
          <section className="mx-auto max-w-2xl">
            <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(29,60,106,0.12)] ring-1 ring-[#F3E3C3]">
              <div className="h-2 bg-gradient-to-r from-[#F59E0B] via-[#F7B733] to-[#F57C00]" />
              <Garland />
              <div className="px-5 pb-6 pt-4 sm:px-10 sm:pb-10">
                <div className="mb-5 flex items-center gap-3">
                  <img src="/logo.jpg" alt="Happy Moments" className="h-11 w-11 rounded-full object-cover ring-2 ring-[#F7B733]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C08A1E]">You're invited to plan</p>
                    <p className="font-serif text-sm text-[#1D3C6A]">Your celebration card · {step + 1} of {steps.length}</p>
                  </div>
                </div>
                {chosen && (
                  <p className="mb-4 rounded-2xl bg-[#FFF3D6] px-4 py-3 text-sm text-[#7A5410]">
                    Fill your card and we'll send it to <strong>{chosen.brand_name}</strong> in a Happy Moments group, along with other good matches.
                  </p>
                )}
                <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[#F7EBD3]">
                  <div className="h-full rounded-full bg-[#F57C00] transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
                </div>

                <div key={step} className="animate-[hmCardIn_.35s_ease-out]">
                  <h1 className="mb-1 font-serif text-2xl font-semibold text-[#1D3C6A] sm:text-3xl">{current.title}</h1>
                  {current.hint && <p className="mb-4 text-sm text-[#6E7A8A]">{current.hint}</p>}
                  <div className={current.hint ? "" : "mt-4"}>{current.body}</div>
                </div>

                {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

                <div className="mt-8 flex items-center justify-between gap-3">
                  <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#1D3C6A] disabled:invisible">← Back</button>
                  <button onClick={() => (last ? submit() : setStep((s) => s + 1))} disabled={!current.valid || saving}
                    className="rounded-xl bg-[#1D3C6A] px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#15305A] disabled:opacity-40">
                    {last ? (saving ? "Sealing your card…" : "Show my matches ✨") : "Next →"}
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-[#8A94A3]">No login needed to see your matches.</p>
          </section>
        )}

        {phase === "celebrate" && (
          <section className="mx-auto flex max-w-xl flex-col items-center py-24 text-center">
            <Confetti />
            <p className="text-6xl" aria-hidden>🎊</p>
            <h1 className="mt-4 font-serif text-3xl font-semibold text-[#1D3C6A]">Congratulations!</h1>
            <p className="mt-2 text-[#4A5A70]">Finding vendors for your {answers.event_type.toLowerCase()}…</p>
          </section>
        )}

        {phase === "results" && (
          <section>
            <div className="mb-6 rounded-3xl bg-white p-5 ring-1 ring-[#F3E3C3] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C08A1E]">Congratulations! Here are your matches</p>
              <h1 className="mt-1 font-serif text-2xl font-semibold text-[#1D3C6A] sm:text-3xl">Your top matches</h1>
              <p className="mt-2 text-sm text-[#4A5A70]">
                {answers.event_type}{answers.event_date ? ` · ${new Date(answers.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                {` · ${answers.area ? `${answers.area}, ` : ""}${answers.city}`}
                {answers.guests ? ` · ~${answers.guests} guests` : ""}
                {` · ${budgetLabel(answers.budget_range)}`}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <button onClick={startOver} className="text-[#1D3C6A] underline">Start a new card</button>
              </div>
            </div>

            {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            {chosen && (
              <div className="mb-10">
                <h2 className="mb-3 font-serif text-xl font-semibold text-[#1D3C6A]">The vendor you picked</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <MatchCard vendor={chosen} busy={opening === chosen.vendor_id} onRequestQuote={contact} />
                </div>
              </div>
            )}

            {matches === null && <p className="py-10 text-center text-[#6E7A8A]">Finding your matches…</p>}

            {matches && answers.services.map((service) => {
              const list = grouped[service] || [];
              return (
                <div key={service} className="mb-10">
                  <h2 className="mb-3 font-serif text-xl font-semibold text-[#1D3C6A]">
                    {serviceLabel(service)} <span className="text-sm font-normal text-[#8A94A3]">· {list.length === 0 ? "no matches yet" : `${list.length} ${list.length === 1 ? "match" : "matches"}`}</span>
                  </h2>
                  {list.length === 0 ? (
                    <p className="rounded-2xl bg-white p-4 text-sm text-[#4A5A70] ring-1 ring-[#F3E3C3]">
                      We don't have a {serviceLabel(service).toLowerCase()} vendor that fits yet. Our team will reach out once you start a chat with any vendor.
                    </p>
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
        onClose={() => setGateFor(null)}
        onDone={() => {
          const v = gateFor;
          setGateFor(null);
          if (v) openGroup(v);
        }}
      />
      <style>{`
        @keyframes hmCardIn { from { opacity: 0; transform: translateY(10px) rotate(-.4deg); } to { opacity: 1; transform: none; } }
        @keyframes hmFall { from { transform: translateY(-10vh) rotate(0); } to { transform: translateY(70vh) rotate(540deg); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .hm-confetti { display: none; } [class*="animate-[hmCardIn"] { animation: none !important; } }
      `}</style>
    </div>
  );
};

const fieldInput =
  "w-full rounded-xl border border-[#E8D9B8] bg-white px-4 py-3 text-[15px] text-[#1D3C6A] placeholder:text-[#9AA5B5] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-[#1D3C6A]">{label}</span>
    {children}
  </label>
);

const Choice: React.FC<{ active: boolean; compact?: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, compact, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className={`flex ${compact ? "px-4 py-2" : "flex-col px-3 py-4"} items-center justify-center gap-1 rounded-2xl text-center font-medium transition
      ${active ? "bg-[#1D3C6A] text-white shadow-md ring-2 ring-[#F7B733]" : "bg-[#FFFBF3] text-[#1D3C6A] ring-1 ring-[#EFDDB8] hover:bg-[#FFF3D6]"}`}>
    {children}
  </button>
);

// A marigold garland across the top of the card.
const Garland = () => (
  <svg viewBox="0 0 600 44" className="h-8 w-full" aria-hidden preserveAspectRatio="none">
    <path d="M0 4 Q150 40 300 4 Q450 40 600 4" fill="none" stroke="#E9C46A" strokeWidth="1.5" />
    {Array.from({ length: 13 }).map((_, i) => {
      const x = i * 50;
      const t = (x % 300) / 300;
      const y = 4 + 72 * t * (1 - t);
      return <circle key={i} cx={x} cy={y} r="5" fill={i % 2 ? "#F57C00" : "#F7B733"} />;
    })}
  </svg>
);

const Confetti = () => (
  <div className="hm-confetti pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
    {Array.from({ length: 28 }).map((_, i) => (
      <span key={i} className="absolute top-0 block h-2.5 w-1.5 rounded-sm"
        style={{
          left: `${(i * 37) % 100}%`,
          background: ["#F57C00", "#F7B733", "#1D3C6A", "#E76F51"][i % 4],
          animation: `hmFall ${1.6 + (i % 5) * 0.3}s ${(i % 7) * 0.1}s ease-in forwards`,
        }} />
    ))}
  </div>
);

export default PlanEvent;
