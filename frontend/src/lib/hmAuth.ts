// Sign-in for the Phase 1 customer journey, group chats and the Super Vendor team.
// Customers: email + password accounts (no email verification; the project
// auto-confirms sign-ups). Vendors: emailed sign-in link/code, because their access
// comes from their email and a password account can't be made with a vendor email
// (database guard hm_guard_vendor_email_accounts). Row level security decides what
// each signed-in person sees.

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type CustomerProfile = {
  user_id: string;
  full_name: string;
  mobile: string;
  email: string | null;
  consent_at: string;
};

/** Sends a one-time code (and sign-in link) to the email. Creates the account if new. */
export async function sendEmailCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true, emailRedirectTo: window.location.href },
  });
  if (error) throw friendlyAuthError(error.message);
}

/** Checks the code from the email and signs the user in. */
export async function verifyEmailCode(email: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code.trim(),
    type: "email",
  });
  if (error || !data.session) throw friendlyAuthError(error?.message || "That code didn't work. Please try again.");
  return data.session;
}

export const PASSWORD_MIN = 8;

/** Creates a customer account and signs in straight away (no verification email). */
export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password });
  if (error) throw friendlyAuthError(error.message);
  // Supabase hides "already registered" behind an empty identities list.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("You already have an account with this email. Sign in instead.");
  }
  if (!data.session) throw new Error("Account created. Please sign in.");
  return data.session;
}

export async function signInWithPassword(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
  if (data?.session) {
    await linkSiteCustomer(cleanEmail);
    return data.session;
  }
  // Someone with an account from the site's older customer login: move them to a
  // proper (hashed-password) account with the same email and password.
  const legacy = await findLegacyCustomer(cleanEmail, password);
  if (legacy) {
    const session = await signUpWithPassword(cleanEmail, password);
    const mobile = normaliseIndianMobile(legacy.mobile_number || "");
    if (mobile) await saveMyCustomerProfile({ full_name: legacy.full_name, mobile, email: cleanEmail });
    await linkSiteCustomer(cleanEmail);
    return session;
  }
  throw friendlyAuthError(error?.message || "Wrong email or password.");
}

/** Older site accounts store base64 of the password in customers.password_hash. */
async function findLegacyCustomer(email: string, password: string) {
  let encoded = "";
  try { encoded = btoa(password); } catch { return null; }
  const { data } = await supabase.from("customers").select("id, full_name, mobile_number")
    .ilike("email", email).eq("password_hash", encoded).maybeSingle();
  return data as { id: number; full_name: string; mobile_number: string | null } | null;
}

/**
 * Signs the same person into the site's existing customer session (header,
 * liked vendors, notifications), which reads localStorage customer_id. The
 * customers row is kept in step by the database (sync_customer_from_profile).
 */
export async function linkSiteCustomer(email?: string | null) {
  const e = (email || (await supabase.auth.getUser()).data.user?.email || "").trim().toLowerCase();
  if (!e) return;
  const { data } = await supabase.from("customers").select("id").ilike("email", e).maybeSingle();
  if (!data) return;
  try { localStorage.setItem("customer_id", String(data.id)); } catch { /* private mode */ }
  window.dispatchEvent(new Event("hm-customer-session"));
}

export async function signOutHm() {
  await supabase.auth.signOut();
  try { localStorage.removeItem("customer_id"); } catch { /* ignore */ }
  window.dispatchEvent(new Event("hm-customer-session"));
}

function friendlyAuthError(message: string) {
  if (/database error saving new user|hm_vendor_email/i.test(message)) {
    return new Error("This email belongs to a Happy Moments vendor. Vendors sign in from My celebrations with \"Email me a sign-in link\".");
  }
  if (/already registered|already exists/i.test(message)) return new Error("You already have an account with this email. Sign in instead.");
  if (/invalid login credentials/i.test(message)) return new Error("Wrong email or password.");
  if (/password should be|weak password/i.test(message)) return new Error(`Use a password with at least ${PASSWORD_MIN} characters.`);
  if (/rate limit|too many|security purposes/i.test(message)) {
    return new Error("Too many codes requested. Please wait a minute and try again.");
  }
  if (/expired|invalid/i.test(message)) return new Error("That code is wrong or has expired. Request a new one.");
  return new Error(message);
}

/** Current Supabase session, kept up to date. `undefined` while loading. */
export function useHmSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return session;
}

export async function getMyCustomerProfile(): Promise<CustomerProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from("customer_profiles").select("*").eq("user_id", auth.user.id).maybeSingle();
  if (error) throw error;
  return data as CustomerProfile | null;
}

export async function saveMyCustomerProfile(fields: { full_name: string; mobile: string; email?: string | null }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Please sign in first.");
  const row = {
    user_id: auth.user.id,
    full_name: fields.full_name.trim(),
    mobile: fields.mobile.replace(/[^\d+]/g, ""),
    email: (fields.email || auth.user.email || "").trim() || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("customer_profiles").upsert(row, { onConflict: "user_id" });
  if (error) throw error;
}

export async function amIStaff(): Promise<{ staff: boolean; role?: string; displayName?: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { staff: false };
  const { data } = await supabase.from("staff_roles").select("role, display_name").eq("user_id", auth.user.id).maybeSingle();
  if (!data) return { staff: false };
  return { staff: true, role: data.role, displayName: data.display_name || auth.user.email || "Happy Moments" };
}

/** Indian mobile: 10 digits starting 6-9, optionally with +91 / 91 / 0 in front. */
export function normaliseIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91") ? digits.slice(2)
    : digits.length === 11 && digits.startsWith("0") ? digits.slice(1)
    : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}
