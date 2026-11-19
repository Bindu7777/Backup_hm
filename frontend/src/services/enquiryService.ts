// Enquiries, vendor matching and opening group chats (Phase 1).
// All access rules live in the database (see supabase/migrations/*phase1*).

import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/config/api";

export const EVENT_TYPES = [
  { key: "Wedding", emoji: "💍" },
  { key: "Engagement", emoji: "💐" },
  { key: "Birthday", emoji: "🎂" },
  { key: "Half saree / Dhoti ceremony", emoji: "🪔" },
  { key: "Baby shower / Naming ceremony", emoji: "🍼" },
  { key: "Housewarming", emoji: "🏡" },
  { key: "Corporate event", emoji: "🏢" },
  { key: "Other celebration", emoji: "🎉" },
] as const;

export const SERVICES = [
  { key: "decor", label: "Decor", emoji: "🌸" },
  { key: "photography", label: "Photography", emoji: "📸" },
  { key: "makeup", label: "Makeup", emoji: "💄" },
  { key: "venue", label: "Venue", emoji: "🏛️" },
  { key: "gifting", label: "Gifting & invitations", emoji: "🎁" },
  { key: "planning", label: "Event planning", emoji: "📋" },
] as const;

export const STYLES = [
  { key: "traditional", label: "Traditional", emoji: "🪷" },
  { key: "modern", label: "Modern", emoji: "✨" },
  { key: "minimal", label: "Minimal", emoji: "🤍" },
] as const;

export const BUDGETS = [
  { key: "under_1l", label: "Under ₹1 lakh" },
  { key: "1l_3l", label: "₹1 – 3 lakh" },
  { key: "3l_5l", label: "₹3 – 5 lakh" },
  { key: "5l_10l", label: "₹5 – 10 lakh" },
  { key: "above_10l", label: "Above ₹10 lakh" },
] as const;

export const serviceLabel = (key: string) => SERVICES.find((s) => s.key === key)?.label || key;
export const budgetLabel = (key?: string | null) => BUDGETS.find((b) => b.key === key)?.label || "Not decided";

export type EnquiryAnswers = {
  event_type: string;
  event_date: string | null; // yyyy-mm-dd
  city: string;
  area: string;
  guests: number | null;
  budget_range: string | null;
  services: string[];
  style_tags: string[];
  notes: string;
  customer_name: string;
};

export type VendorMatch = {
  service: string;
  vendor_id: number;
  slug: string | null;
  brand_name: string;
  area_label: string;
  categories: string[];
  starting_price: number | null;
  good_for: string | null;
  verified: boolean;
  photos: string[];
  score: number;
  // Card facts (see vendor_card_stats in the database). Null when not trustworthy.
  rating?: number | string | null;
  review_count?: number | null;
  review_source?: "happy_moments" | "vendor" | null;
  events_done?: number | null;
  experience?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  highlights?: string[] | null;
  logo?: string | null;
};

/** Photos come back as full URLs or as "bucket/path" in public storage. */
export function photoUrl(p: string | null | undefined): string {
  if (!p) return "";
  if (/^https?:\/\//.test(p)) return p;
  const slash = p.indexOf("/");
  return supabase.storage.from(p.slice(0, slash)).getPublicUrl(p.slice(slash + 1)).data.publicUrl;
}

/** The chosen vendor's photos and logo, same rules as the matches. */
export async function vendorPhotosAndLogo(vendorId: number): Promise<{ photos: string[]; logo: string | null }> {
  const [ph, lg] = await Promise.all([
    supabase.rpc("vendor_photos", { p_vendor_id: vendorId, p_limit: 4 }),
    supabase.rpc("vendor_logo", { p_vendor_id: vendorId }),
  ]);
  return { photos: (ph.data as string[]) || [], logo: (lg.data as string) || null };
}

export type VendorCardStats = Pick<VendorMatch,
  "rating" | "review_count" | "review_source" | "events_done" | "experience" | "price_min" | "price_max" | "highlights">;

export async function vendorCardStats(vendorId: number): Promise<VendorCardStats | null> {
  const { data } = await supabase.rpc("vendor_card_stats", { p_vendor_id: vendorId });
  return (Array.isArray(data) ? data[0] : data) || null;
}

type PendingEnquiry = { id: string; claimToken: string | null; answers: EnquiryAnswers; savedAt: string };
const PENDING_KEY = "hm_pending_enquiry";

export function getPendingEnquiry(): PendingEnquiry | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingEnquiry) : null;
  } catch {
    return null;
  }
}

function setPendingEnquiry(value: PendingEnquiry | null) {
  try {
    if (value) localStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    /* private mode: the flow still works within this page */
  }
}

/** Saves the greeting-card answers. Works signed in or not. */
export async function createEnquiry(a: EnquiryAnswers): Promise<PendingEnquiry> {
  const { data, error } = await supabase.rpc("create_enquiry", {
    p_event_type: a.event_type,
    p_event_date: a.event_date || null,
    p_city: a.city,
    p_area: a.area,
    p_guests: a.guests,
    p_budget_range: a.budget_range,
    p_services: a.services,
    p_style_tags: a.style_tags,
    p_notes: a.notes,
    p_customer_name: a.customer_name,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  const pending = { id: row.enquiry_id, claimToken: row.claim_token ?? null, answers: a, savedAt: new Date().toISOString() };
  setPendingEnquiry(pending);
  return pending;
}

/** Attaches an enquiry made before sign-up to the signed-in customer. */
export async function claimPendingEnquiry(pending: PendingEnquiry) {
  const { data, error } = await supabase.rpc("claim_enquiry", { p_enquiry_id: pending.id, p_claim_token: pending.claimToken || "" });
  if (error) throw error;
  if (!data) throw new Error("We couldn't link your enquiry to your account. Please fill the card again.");
  setPendingEnquiry({ ...pending, claimToken: null });
}

export async function matchVendors(a: EnquiryAnswers): Promise<VendorMatch[]> {
  const { data, error } = await supabase.rpc("match_vendors", {
    p_services: a.services,
    p_city: a.city,
    p_area: a.area || null,
    p_guests: a.guests,
    p_budget_range: a.budget_range,
    p_style_tags: a.style_tags,
    p_per_service: 2, // the matches page shows at most 2 vendors per service
  });
  if (error) throw error;
  return (data || []) as VendorMatch[];
}

/** Opens (or reuses) the group for this enquiry + vendor and returns its id. */
export async function openChatGroup(enquiryId: string, vendorId: number): Promise<string> {
  const { data, error } = await supabase.rpc("open_chat_group", { p_enquiry_id: enquiryId, p_vendor_id: vendorId });
  if (error) throw error;
  notifyChat(data as string, "new_group");
  return data as string;
}

/** Asks the backend to email the other side. Fire-and-forget: chat works without it. */
export async function notifyChat(groupId: string, kind: "new_group" | "message") {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token || !API_BASE_URL) return;
    await fetch(`${API_BASE_URL}/api/chat/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ group_id: groupId, kind, link: `${window.location.origin}/chat/${groupId}` }),
    });
  } catch {
    /* emails are best-effort */
  }
}
