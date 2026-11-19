// Emails the other side of a Happy Moments group when there's a new enquiry or
// message, with a Reply button that opens the group.
//
// Uses the caller's own Supabase sign-in token: the database (chat_email_targets)
// checks they belong to the group, picks the recipients and throttles repeats.
// No service role key is needed.

const express = require('express');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('../services/emailService');
const log = require('../utils/logger')('chatNotify');
const { errorFields } = require('../utils/logger');

const router = express.Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
// Links in emails always point at our own site, never at a URL sent by the browser.
const siteUrl = (process.env.FRONTEND_URL || 'https://happymomentsindia.com').replace(/\/+$/, '');

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escapeHtml = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'date to be decided';

function buildEmail(target, kind, link) {
  const when = fmtDate(target.event_date);
  const event = target.event_type || 'event';
  const isVendor = target.recipient_role === 'vendor';
  const subject = kind === 'new_group'
    ? `New enquiry: ${event}, ${when} · Happy Moments`
    : `New message about the ${event} on ${when} · Happy Moments`;
  const intro = kind === 'new_group'
    ? `You have a new enquiry from a Happy Moments customer${target.customer_name ? `, ${target.customer_name}` : ''}.`
    : isVendor
      ? `There's a new message in your Happy Moments group with ${target.customer_name || 'a customer'}.`
      : `There's a new message in your Happy Moments group with ${target.vendor_name}.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #FFF8EC; padding: 24px; border-radius: 16px; color: #1D3C6A;">
      <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #C08A1E; margin: 0 0 8px;">Happy Moments</p>
      <h2 style="margin: 0 0 12px; font-family: Georgia, serif;">${escapeHtml(event)} · ${escapeHtml(when)}</h2>
      <p style="font-size: 15px; line-height: 1.5;">Hi ${escapeHtml(target.recipient_name || 'there')},</p>
      <p style="font-size: 15px; line-height: 1.5;">${escapeHtml(intro)} Please reply inside the group so the conversation stays protected.</p>
      <p style="margin: 24px 0;">
        <a href="${link}" style="background: #F57C00; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-weight: bold;">Reply in the group</a>
      </p>
      <p style="font-size: 12px; color: #6E7A8A;">Sign in with this email address to open the group. Happy Moments is not responsible for conversations or agreements that happen outside the official groups.</p>
    </div>`;
  const text = `Hi ${target.recipient_name || 'there'},\n\n${intro} Please reply inside the group: ${link}\n\nSign in with this email address to open it.\n\nHappy Moments`;
  return { subject, html, text };
}

router.post('/notify', limiter, async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const groupId = String(req.body?.group_id || '');
  const kind = req.body?.kind === 'new_group' ? 'new_group' : 'message';

  if (!token) return res.status(401).json({ success: false, error: 'Sign in required' });
  if (!UUID.test(groupId)) return res.status(400).json({ success: false, error: 'Bad group id' });
  if (!supabaseUrl || !anonKey) return res.status(500).json({ success: false, error: 'Supabase is not configured' });

  try {
    // A client that acts as the signed-in caller, so row level security applies.
    const asCaller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: targets, error } = await asCaller.rpc('chat_email_targets', { p_group_id: groupId, p_kind: kind });
    if (error) {
      log.warn('notify', 'Not allowed or failed', { groupId, kind, error: errorFields(error) });
      return res.status(403).json({ success: false, error: 'Not allowed' });
    }

    const link = `${siteUrl}/chat/${groupId}`;
    let sent = 0;
    for (const t of targets || []) {
      if (!t.recipient_email) {
        log.warn('notify', 'Recipient has no email', { groupId, role: t.recipient_role });
        continue;
      }
      const { subject, html, text } = buildEmail(t, kind, link);
      try {
        await sendEmail({ to: t.recipient_email, subject, html, text });
        sent += 1;
      } catch (err) {
        log.error('notify', 'Email failed', { groupId, role: t.recipient_role, error: errorFields(err) });
      }
    }
    log.info('notify', 'Chat notification done', { groupId, kind, sent, skipped: (targets || []).length - sent });
    res.json({ success: true, sent });
  } catch (err) {
    log.error('notify', 'Chat notification errored', { groupId, error: errorFields(err) });
    res.status(500).json({ success: false, error: 'Could not send notifications' });
  }
});

module.exports = router;
