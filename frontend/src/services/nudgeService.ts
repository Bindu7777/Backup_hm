// Reminder ("nudge") messages. v1 builds free WhatsApp click-to-chat links that a
// Super Vendor sends from their own WhatsApp. To plug in a paid provider later
// (WhatsApp Business API, Twilio…), add another channel here and call it from the
// dashboard instead of opening the link. The message text stays in one place.

type NudgeTarget = "vendor" | "customer";
type GroupInfo = {
  vendor_name: string; vendor_whatsapp: string | null;
  customer_name: string | null; customer_mobile: string | null;
  event_type: string; event_date: string | null;
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "date to be decided";

export function reminderText(g: GroupInfo, target: NudgeTarget, staffName: string, groupLink: string) {
  if (target === "vendor") {
    return `Hi ${g.vendor_name}, you have a new enquiry from a Happy Moments customer (${g.event_type}, ${fmtDate(g.event_date)}). Please reply in the group here: ${groupLink}`;
  }
  return `Hi ${g.customer_name || "there"}, this is ${staffName} from Happy Moments. ${g.vendor_name} is waiting for your reply about your ${g.event_type.toLowerCase()}. Please continue the conversation here: ${groupLink}`;
}

/** wa.me number: digits only, with India's 91 added to 10-digit numbers. */
export function waNumber(raw: string | null): string | null {
  const d = (raw || "").replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

export function buildReminder(g: GroupInfo, target: NudgeTarget, staffName: string, groupLink: string): string | null {
  const number = waNumber(target === "vendor" ? g.vendor_whatsapp : g.customer_mobile);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(reminderText(g, target, staffName, groupLink))}`;
}
