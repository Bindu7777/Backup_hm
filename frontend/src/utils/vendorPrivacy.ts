// Customers never see a vendor's phone, WhatsApp or email: every contact goes
// through a Happy Moments group. Pages call hideVendorContact() on vendor data
// before showing it, and send "contact" buttons to quoteLink().

const CONTACT_FIELDS = ["phone_number", "whatsapp_number", "alternate_number", "email", "secondary_phone_number"] as const;

/** Admin screens keep full details; this is a UI hint only, the admin pages have their own checks. */
export const isAdminViewer = () => {
  try {
    return localStorage.getItem("adminLoggedIn") === "true";
  } catch {
    return false;
  }
};

export function hideVendorContact<T extends Record<string, any> | null | undefined>(vendor: T): T {
  if (!vendor || isAdminViewer()) return vendor;
  const copy: Record<string, any> = { ...vendor };
  for (const f of CONTACT_FIELDS) if (f in copy) copy[f] = undefined;
  return copy as T;
}

export const hideVendorsContact = <T extends Record<string, any>>(list: T[] | null | undefined): T[] =>
  (list || []).map((v) => hideVendorContact(v));

/** Where every "contact this vendor" button goes: the greeting card, then a group chat. */
export function quoteLink(vendor?: { vendor_id?: string | number; brand_name?: string; spoc_name?: string } | null) {
  if (!vendor?.vendor_id) return "/smart-request";
  const name = vendor.brand_name || vendor.spoc_name || "";
  return `/smart-request?vendor=${encodeURIComponent(String(vendor.vendor_id))}${name ? `&name=${encodeURIComponent(name)}` : ""}`;
}
