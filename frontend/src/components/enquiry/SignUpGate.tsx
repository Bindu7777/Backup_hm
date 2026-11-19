// Sign-up / sign-in with a one-time email code.
//   mode="customer": also asks for name + mobile and records consent (needed before
//                    contacting a vendor).
//   mode="signin":   email code only (vendors replying in groups, Super Vendors).

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getMyCustomerProfile,
  normaliseIndianMobile,
  saveMyCustomerProfile,
  sendEmailCode,
  useHmSession,
  verifyEmailCode,
} from "@/lib/hmAuth";

type Props = {
  open: boolean;
  mode?: "customer" | "signin";
  defaultName?: string;
  defaultMobile?: string;
  title?: string;
  onClose: () => void;
  onDone: () => void;
};

type Step = "email" | "code" | "profile";

export const SignUpGate: React.FC<Props> = ({ open, mode = "customer", defaultName = "", defaultMobile = "", title, onClose, onDone }) => {
  const session = useHmSession();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState(defaultName);
  const [mobile, setMobile] = useState(defaultMobile);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // The gate is mounted before the card is filled: pick up the card's name and mobile.
  useEffect(() => {
    if (!open) return;
    if (defaultName) setName((n) => n || defaultName);
    if (defaultMobile) setMobile((m) => m || defaultMobile);
  }, [open, defaultName, defaultMobile]);

  // Already signed in: skip straight to the profile step (or finish).
  useEffect(() => {
    if (!open || session === undefined) return;
    setError("");
    if (!session) {
      setStep("email");
      return;
    }
    if (mode === "signin") {
      onDone();
      return;
    }
    getMyCustomerProfile()
      .then((p) => (p ? onDone() : setStep("profile")))
      .catch(() => setStep("profile"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session?.user?.id]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error("Enter a valid email address.");
      await sendEmailCode(email);
      setStep("code");
      setCooldown(60);
    });

  const checkCode = () =>
    run(async () => {
      if (!/^\d{6,10}$/.test(code.trim())) throw new Error("Enter the code from the email.");
      await verifyEmailCode(email, code);
      // The session effect above moves on to the profile step or finishes.
    });

  const saveProfile = () =>
    run(async () => {
      if (name.trim().length < 2) throw new Error("Please tell us your name.");
      const ten = normaliseIndianMobile(mobile);
      if (!ten) throw new Error("Enter a valid 10-digit Indian mobile number.");
      if (!consent) throw new Error("Please tick the box to continue.");
      await saveMyCustomerProfile({ full_name: name, mobile: ten, email: session?.user?.email });
      onDone();
    });

  const input =
    "w-full rounded-xl border border-[#E8D9B8] bg-white px-4 py-3 text-[15px] text-[#1D3C6A] placeholder:text-[#9AA5B5] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]";
  const primary =
    "w-full rounded-xl bg-[#1D3C6A] py-3 text-[15px] font-semibold text-white transition hover:bg-[#15305A] disabled:opacity-60";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-md rounded-3xl border-[#F3E3C3] bg-[#FFFBF3] p-0 sm:rounded-3xl">
        <div className="rounded-t-3xl bg-gradient-to-r from-[#F59E0B] via-[#F7B733] to-[#F57C00] px-6 py-5 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-white">
              {title || (mode === "customer" ? "One quick step" : "Sign in")}
            </DialogTitle>
            <DialogDescription className="text-white/90">
              {mode === "customer"
                ? "Sign up to talk to vendors. Your answers are saved, so there's nothing to fill again."
                : "We'll email you a one-time code."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-2">
          {step === "email" && (
            <>
              <label className="block text-sm font-medium text-[#1D3C6A]" htmlFor="hm-email">Email</label>
              <input id="hm-email" type="email" autoComplete="email" className={input} value={email}
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendCode()}
                placeholder="you@example.com" autoFocus />
              <button className={primary} disabled={busy} onClick={sendCode}>{busy ? "Sending…" : "Email me a code"}</button>
            </>
          )}

          {step === "code" && (
            <>
              <p className="text-sm text-[#4A5A70]">
                We sent a code to <strong>{email}</strong>. Enter it below, or tap the sign-in link in that email.
              </p>
              <input inputMode="numeric" autoComplete="one-time-code" className={`${input} tracking-[0.4em]`} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && checkCode()}
                placeholder="••••••" maxLength={10} autoFocus />
              <button className={primary} disabled={busy} onClick={checkCode}>{busy ? "Checking…" : "Continue"}</button>
              <div className="flex justify-between text-sm">
                <button className="text-[#1D3C6A] underline" onClick={() => setStep("email")}>Change email</button>
                <button className="text-[#1D3C6A] underline disabled:no-underline disabled:opacity-50" disabled={cooldown > 0 || busy} onClick={sendCode}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </>
          )}

          {step === "profile" && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#1D3C6A]" htmlFor="hm-name">Your name</label>
                <input id="hm-name" className={input} value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1D3C6A]" htmlFor="hm-mobile">Mobile number</label>
                <input id="hm-mobile" type="tel" inputMode="tel" autoComplete="tel" className={input} value={mobile}
                  onChange={(e) => setMobile(e.target.value)} placeholder="98765 43210" />
                <p className="mt-1 text-xs text-[#6E7A8A]">Only shared with a vendor when you tap "Request a call".</p>
              </div>
              <label className="flex items-start gap-3 rounded-xl bg-white p-3 text-[13px] leading-snug text-[#4A5A70] ring-1 ring-[#F3E3C3]">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1D3C6A]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>
                  I agree that my enquiry details are shared with the vendors I choose, and that my conversations
                  happen in Happy Moments groups so they stay protected.
                </span>
              </label>
              <button className={primary} disabled={busy} onClick={saveProfile}>{busy ? "Saving…" : "Start chatting"}</button>
              <p className="text-[11px] leading-snug text-[#8A94A3]">
                Happy Moments is not responsible for conversations or agreements that happen outside the official
                Happy Moments groups.
              </p>
            </>
          )}

          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpGate;
