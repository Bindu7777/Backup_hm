// Vendor photos the Happy Moments team has hidden from customers (e.g. a flyer
// with the vendor's phone number on it). Customer pages filter them out; the
// vendor's and admin's edit screens still show everything.

import { supabase } from "@/lib/supabase";
import { isAdminViewer } from "@/utils/vendorPrivacy";

/** Same rule as public.photo_key() in the database: the storage path, no query string. */
export function photoKey(url: string | null | undefined): string {
  if (!url) return "";
  const marker = "/object/public/";
  const i = url.indexOf(marker);
  const path = i >= 0 ? url.slice(i + marker.length) : url;
  return path.split("?")[0];
}

let cache: { at: number; keys: Set<string> } | null = null;

export async function getHiddenPhotoKeys(force = false): Promise<Set<string>> {
  if (!force && cache && Date.now() - cache.at < 60_000) return cache.keys;
  const { data, error } = await supabase.from("vendor_photo_flags").select("photo_key");
  // If the list can't be loaded, keep the last known one rather than showing everything.
  if (error) return cache?.keys ?? new Set();
  cache = { at: Date.now(), keys: new Set((data || []).map((r: any) => r.photo_key)) };
  return cache.keys;
}

/** Drops hidden photos from a list for customers. `pick` returns each item's URL. */
export async function withoutHiddenPhotos<T>(items: T[] | null | undefined, pick: (item: T) => string | null | undefined): Promise<T[]> {
  const list = items || [];
  if (list.length === 0 || isAdminViewer()) return list;
  const hidden = await getHiddenPhotoKeys();
  if (hidden.size === 0) return list;
  return list.filter((item) => !hidden.has(photoKey(pick(item))));
}

export async function setPhotoHidden(vendorId: number, url: string, hidden: boolean, reason?: string) {
  const { error } = await supabase.rpc("set_vendor_photo_hidden", {
    p_vendor_id: vendorId,
    p_url: url,
    p_hidden: hidden,
    p_reason: reason || null,
  });
  if (error) throw error;
  cache = null;
}
