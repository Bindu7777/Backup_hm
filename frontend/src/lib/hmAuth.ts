// Sign-in for the Phase 1 customer journey, group chats and the Super Vendor team.
// Everyone signs in with Supabase Auth using a one-time email code, so the
// database knows who is asking and its row level security decides what they see.

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

export async function signOutHm() {
  await supabase.auth.signOut();
}

function friendlyAuthError(message: string) {
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
