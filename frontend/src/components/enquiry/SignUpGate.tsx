// Customer account: email + password, no email verification.
//   mode="customer": "New here" creates the account with name + mobile + consent
//                    (a customer account), "I have an account" signs in. Needed
//                    before contacting a vendor.
//   mode="signin":   sign in with email + password. Vendors use "Email me a sign-in
//                    link" instead (their access comes from their email address).

import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  PASSWORD_MIN,
  getMyCustomerProfile,
  linkSiteCustomer,
  normaliseIndianMobile,
  saveMyCustomerProfile,
  sendEmailCode,
  signInWithPassword,
  signUpWithPassword,
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

type Step = "account" | "code" | "profile";

const validEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e.trim());

export const SignUpGate: React.FC<Props> = ({ open, mode = "customer", defaultName = "", defaultMobile = "", title, onClose, onDone }) => {
  const session = useHmSession();
  const [step, setStep] = useState<Step>("account");
  const [tab, setTab] = useState<"new" | "existing">(mode === "customer" ? "new" : "existing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState(defaultName);
  const [mobile, setMobile] = useState(defaultMobile);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  // While "New here" creates the account and saves the profile, don't let the
  // session watcher below jump in (it would see no profile yet).
  const creating = useRef(false);

  // The gate is mounted before the card is filled: pick up the card's name and mobile.
  useEffect(() => {
    if (!open) return;
    if (defaultName) setName((n) => n || defaultName);
    if (defaultMobile) setMobile((m) => m || defaultMobile);
  }, [open, defaultName, defaultMobile]);

  // Signed in (now or already): finish, or ask for the customer details once.
  useEffect(() => {
    if (!open || session === undefined || creating.current) return;
    setError("");
    if (!session) {
      if (step !== "code") setStep("account");
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

  const checkProfileFields = () => {
    if (name.trim().length < 2) throw new Error("Please tell us your name.");
    const ten = normaliseIndianMobile(mobile);
    if (!ten) throw new Error("Enter a valid 10-digit Indian mobile number.");
    if (!consent) throw new Error("Please tick the box to continue.");
    return ten;
  };

  const createAccount = () =>
    run(async () => {
      const ten = checkProfileFields();
      if (!validEmail(email)) throw new Error("Enter a valid email address.");
      if (password.length < PASSWORD_MIN) throw new Error(`Use a password with at least ${PASSWORD_MIN} characters.`);
      creating.current = true;
      try {
        await signUpWithPassword(email, password);
        await saveMyCustomerProfile({ full_name: name, mobile: ten, email });
        await linkSiteCustomer(email);
      } finally {
        creating.current = false;
      }
      onDone();
    });

  const signIn = () =>
    run(async () => {
      if (!validEmail(email)) throw new Error("Enter a valid email address.");
      if (!password) throw new Error("Enter your password.");
      await signInWithPassword(email, password);
      // The session watcher above finishes, or asks for the customer details.
    });

  const sendLink = () =>
    run(async () => {
      if (!validEmail(email)) throw new Error("Enter your vendor email first.");
      await sendEmailCode(email);
      setStep("code");
      setCooldown(60);
    });

  const checkCode = () =>
    run(async () => {
      if (!/^\d{6,10}$/.test(code.trim())) throw new Error("Enter the code from the email.");
      await verifyEmailCode(email, code);
    });

  const saveProfile = () =>
    run(async () => {
      const ten = checkProfileFields();
      await saveMyCustomerProfile({ full_name: name, mobile: ten, email: session?.user?.email });
      await linkSiteCustomer(session?.user?.email);
      onDone();
    });

  const input =
    "w-full rounded-xl border border-[#E3CFA8] bg-white px-4 py-3 text-[16px] text-[#3D2A30] placeholder:text-[#9C8A8F] focus:outline-none focus:ring-2 focus:ring-[#D4A63A]";
  const label = "mb-1 block text-sm font-semibold text-[#5A1E33]";
  const primary =
    "w-full rounded-2xl bg-[#7A1F3D] py-3.5 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(122,31,61,0.25)] transition hover:bg-[#661833] active:scale-[.98] disabled:opacity-60";
  const link = "font-medium text-[#7A1F3D] underline underline-offset-2";

  const passwordField = (autoComplete: "new-password" | "current-password", onEnter: () => void) => (
    <div>
      <label className={label} htmlFor="hm-password">Password</label>
      <div className="relative">
        <input id="hm-password" type={showPw ? "text" : "password"} autoComplete={autoComplete} className={`${input} pr-16`}
          value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onEnter()}
          placeholder={autoComplete === "new-password" ? `At least ${PASSWORD_MIN} characters` : "Your password"} />
        <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[#7A1F3D] hover:bg-[#FFF3DC]">
          {showPw ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );

  const consentBox = (
    <label className="flex items-start gap-3 rounded-xl bg-white p-3 text-[13px] leading-snug text-[#5A4A50] ring-1 ring-[#EFDDBD]">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#7A1F3D]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
      <span>
        I agree that my enquiry details are shared with the vendors I choose, and that my conversations
        happen in Happy Moments groups so they stay protected.
      </span>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="z-[70] max-h-[calc(100dvh-24px)] max-w-md overflow-y-auto rounded-3xl border-[#EFDDBD] bg-[#FFF8EC] p-0 sm:rounded-3xl">
        <div className="rounded-t-3xl bg-[#7A1F3D] px-6 pb-5 pt-6 text-white"
          style={{ backgroundImage: "radial-gradient(rgba(232,190,96,0.25) 1.2px, transparent 1.3px)", backgroundSize: "14px 14px" }}>
          <DialogHeader>
            <DialogTitle className="font-['Lora',serif] text-2xl text-white">
              {title || (step === "profile" ? "Almost there" : mode === "customer" ? (tab === "new" ? "Create your account" : "Welcome back") : "Sign in")}
            </DialogTitle>
            <DialogDescription className="text-[#F6D58A]">
              {mode === "customer"
                ? "Your card is saved. Your account keeps all your cards and chats in one place."
                : "See your celebration cards and conversations."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-4">
          {step === "account" && (
            <>
              <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl bg-[#F6E9D2] p-1">
                {(["new", "existing"] as const).map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setError(""); }}
                    className={`rounded-xl py-2 text-sm font-semibold transition ${tab === t ? "bg-white text-[#7A1F3D] shadow-sm" : "text-[#7D6B71]"}`}>
                    {t === "new" ? "New here" : "I have an account"}
                  </button>
                ))}
              </div>

              {tab === "new" ? (
                <>
                  <div>
                    <label className={label} htmlFor="hm-name">Your name</label>
                    <input id="hm-name" className={input} value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className={label} htmlFor="hm-mobile">Mobile number</label>
                    <input id="hm-mobile" type="tel" inputMode="tel" autoComplete="tel" className={input} value={mobile}
                      onChange={(e) => setMobile(e.target.value)} placeholder="98765 43210" />
                    <p className="mt-1 text-xs text-[#7D6B71]">Only shared with a vendor when you tap "Request a call".</p>
                  </div>
                  <div>
                    <label className={label} htmlFor="hm-email">Email</label>
                    <input id="hm-email" type="email" autoComplete="email" className={input} value={email}
                      onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  {passwordField("new-password", createAccount)}
                  {consentBox}
                  <button className={primary} disabled={busy} onClick={createAccount}>{busy ? "Creating your account…" : "Create account & continue"}</button>
                  <p className="text-[11px] leading-snug text-[#8C7A80]">
                    Happy Moments is not responsible for conversations or agreements that happen outside the official
                    Happy Moments groups.
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <label className={label} htmlFor="hm-email">Email</label>
                    <input id="hm-email" type="email" autoComplete="email" className={input} value={email}
                      onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  {passwordField("current-password", signIn)}
                  <button className={primary} disabled={busy} onClick={signIn}>{busy ? "Signing in…" : "Sign in"}</button>
                  {mode === "signin" && (
                    <p className="text-center text-xs text-[#7D6B71]">
                      Vendor? <button className={link} onClick={sendLink} disabled={busy}>Email me a sign-in link</button>
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {step === "code" && (
            <>
              <p className="text-sm text-[#5A4A50]">
                We emailed <strong>{email}</strong>. Tap the sign-in link in that email, or type the code if it shows one.
              </p>
              <input inputMode="numeric" autoComplete="one-time-code" className={`${input} tracking-[0.4em]`} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && checkCode()}
                placeholder="••••••" maxLength={10} aria-label="Code from the email" />
              <button className={primary} disabled={busy} onClick={checkCode}>{busy ? "Checking…" : "Continue"}</button>
              <div className="flex justify-between text-sm">
                <button className={link} onClick={() => setStep("account")}>Back</button>
                <button className={`${link} disabled:no-underline disabled:opacity-50`} disabled={cooldown > 0 || busy} onClick={sendLink}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                </button>
              </div>
            </>
          )}

          {step === "profile" && (
            <>
              <p className="text-sm text-[#5A4A50]">Signed in as <strong>{session?.user?.email}</strong>. Just a few details to set up your customer account.</p>
              <div>
                <label className={label} htmlFor="hm-name">Your name</label>
                <input id="hm-name" className={input} value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="hm-mobile">Mobile number</label>
                <input id="hm-mobile" type="tel" inputMode="tel" autoComplete="tel" className={input} value={mobile}
                  onChange={(e) => setMobile(e.target.value)} placeholder="98765 43210" />
              </div>
              {consentBox}
              <button className={primary} disabled={busy} onClick={saveProfile}>{busy ? "Saving…" : "Continue"}</button>
            </>
          )}

          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpGate;
