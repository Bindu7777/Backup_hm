const express = require('express');
const router = express.Router();
const { MomoStorage } = require('../services/momoStorage');
const { MomoAuthService } = require('../services/momoAuthService');
const { MomoMetaService } = require('../services/momoMetaService');
const { MomoAnalyticsService } = require('../services/momoAnalyticsService');
const { MomoIntelligenceService } = require('../services/momoIntelligenceService');
const { MomoReplyService } = require('../services/momoReplyService');
const { MomoJobService } = require('../services/momoJobService');

// Middleware to verify Momo session token
const verifyMomoSession = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const tokenHeader = req.headers['x-momo-session'];
  let token = tokenHeader;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'MOMO_AUTH_REQUIRED',
      error: 'Momo verification required. Please enter your secret to access Momo Bot.'
    });
  }

  const result = await MomoAuthService.validateSession(token);
  if (!result.valid) {
    return res.status(401).json({
      success: false,
      code: 'MOMO_SESSION_EXPIRED',
      error: 'Momo session has expired due to inactivity. Please verify your secret again.'
    });
  }

  req.momoSession = result.session;
  req.adminId = result.session.admin_id;
  next();
};

// -----------------------------------------------------------------------------
// PUBLIC / UNVERIFIED ENDPOINTS (Status, Secret Verification, Webhooks)
// -----------------------------------------------------------------------------

/**
 * GET /api/momo/status
 * Public status check for Momo service and whether a given session token is valid
 */
router.get('/status', async (req, res) => {
  try {
    const token = req.headers['x-momo-session'] || (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null);
    let sessionValid = false;
    let adminId = null;

    if (token) {
      const validation = await MomoAuthService.validateSession(token);
      sessionValid = validation.valid;
      if (validation.session) adminId = validation.session.admin_id;
    }

    const metaStatus = await MomoMetaService.getConnectionStatus();
    const gaStatus = await MomoAnalyticsService.getGA4Status();

    res.json({
      success: true,
      service: 'Momo Bot AI Business Assistant',
      version: '1.0.0',
      sessionValid,
      adminId,
      integrations: {
        meta_instagram: metaStatus.status,
        google_analytics: gaStatus.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/momo/auth/verify
 * Screen B: Verify secret password and return secure session token
 */
router.post('/auth/verify', async (req, res) => {
  try {
    const { secret, adminId } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await MomoAuthService.verifySecret(adminId || 'admin', secret, ip, userAgent);
    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt,
      adminId: result.adminId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/momo/auth/lock
 * Invalidate Momo session immediately
 */
router.post('/auth/lock', async (req, res) => {
  try {
    const token = req.headers['x-momo-session'] || req.body.sessionToken;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await MomoAuthService.lockSession(token, req.body.adminId, ip);
    res.json({ success: true, message: 'Momo session locked.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Meta Webhooks (GET for verification challenge, POST for incoming events)
 */
router.get('/webhooks/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verification = MomoMetaService.verifyWebhookChallenge(mode, token, challenge);
  if (verification.verified) {
    return res.status(200).send(verification.challenge);
  }
  res.status(403).send('Forbidden: Invalid verification token');
});

router.post('/webhooks/meta', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const rawBody = JSON.stringify(req.body);

    const isValid = MomoMetaService.validateWebhookSignature(signature, rawBody);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
    }

    // Process incoming events (messages/comments)
    const entry = req.body.entry || [];
    for (const item of entry) {
      const messaging = item.messaging || [];
      for (const msg of messaging) {
        if (msg.message && !msg.message.is_echo) {
          const senderId = msg.sender?.id;
          const text = msg.message?.text || '';
          const conv = {
            provider: 'instagram_dm',
            provider_conversation_id: `ig_conv_${senderId}`,
            participant_id: senderId,
            participant_name: `IG User ${senderId.slice(-4)}`,
            latest_message_summary: text,
            last_message_at: new Date().toISOString()
          };
          await MomoStorage.saveConversation(conv);
          await MomoReplyService.draftReply(conv, { content: text, sent_at: new Date().toISOString() });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(200).json({ received: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// PROTECTED ENDPOINTS (Requires verifyMomoSession)
// -----------------------------------------------------------------------------
router.use(verifyMomoSession);

/**
 * GET /api/momo/dashboard
 * Complete dashboard state including integration status, metrics, latest report, and pending replies
 */
router.get('/dashboard', async (req, res) => {
  try {
    const periodType = req.query.period || '30d';
    const customStart = req.query.start || null;
    const customEnd = req.query.end || null;

    const [metaStatus, gaStatus, internalMetrics, instagramMetrics, latestReport, replyDrafts, knowledgeBase] =
      await Promise.all([
        MomoMetaService.getConnectionStatus(),
        MomoAnalyticsService.getGA4Status(),
        MomoAnalyticsService.fetchInternalMetrics(periodType, customStart, customEnd),
        MomoMetaService.fetchLiveMetrics(),
        MomoStorage.getLatestReport(),
        MomoStorage.getReplyDrafts('all'),
        MomoStorage.getKnowledgeBase()
      ]);

    const pendingReplies = replyDrafts.filter(d => d.approval_status === 'pending');
    const blockedReplies = replyDrafts.filter(d => d.approval_status === 'blocked');
    const sentReplies = replyDrafts.filter(d => d.approval_status === 'sent');

    res.json({
      success: true,
      integrations: {
        meta_instagram: metaStatus,
        google_analytics: gaStatus
      },
      metrics: {
        business: internalMetrics.business,
        website: internalMetrics.website,
        instagram: instagramMetrics,
        period: internalMetrics.period
      },
      report: latestReport,
      replyQueue: {
        total: replyDrafts.length,
        pending: pendingReplies.length,
        blocked: blockedReplies.length,
        sent: sentReplies.length,
        drafts: replyDrafts
      },
      knowledgeBaseCount: knowledgeBase.length
    });
  } catch (err) {
    console.error('Error fetching Momo dashboard:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/momo/refresh
 * Triggers asynchronous refresh analysis workflow
 */
router.post('/refresh', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const options = {
      periodType: req.body.periodType || '30d',
      customStart: req.body.customStart || null,
      customEnd: req.body.customEnd || null
    };

    const jobResult = await MomoJobService.startRefreshJob(req.adminId, ip, options);
    res.json({
      success: true,
      ...jobResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/momo/jobs/:job_id
 * Check refresh job progress
 */
router.get('/jobs/:job_id', (req, res) => {
  const status = MomoJobService.getJobStatus(req.params.job_id);
  if (!status.found) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  res.json({ success: true, ...status });
});

/**
 * GET /api/momo/insights
 * Return generated AI reports and structured insights
 */
router.get('/insights', async (req, res) => {
  try {
    const latest = await MomoStorage.getLatestReport();
    res.json({ success: true, report: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/momo/conversations
 * Ingested customer conversations & history
 */
router.get('/conversations', async (req, res) => {
  try {
    const convs = await MomoStorage.getConversations();
    res.json({ success: true, conversations: convs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/momo/replies/draft
 * Generate a new or refreshed draft for a conversation
 */
router.post('/replies/draft', async (req, res) => {
  try {
    const { conversation, message } = req.body;
    if (!conversation || !message) {
      return res.status(400).json({ success: false, error: 'Conversation and message are required' });
    }
    const draft = await MomoReplyService.draftReply(conversation, message);
    res.json({ success: true, draft });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/momo/replies/:reply_id
 * Edit or update draft content / approve status
 */
router.patch('/replies/:reply_id', async (req, res) => {
  try {
    const replyId = Number(req.params.reply_id);
    const drafts = await MomoStorage.getReplyDrafts('all');
    const existing = drafts.find(d => d.id === replyId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reply draft not found' });
    }

    const updated = await MomoStorage.saveReplyDraft({
      ...existing,
      ...req.body,
      id: replyId
    });

    res.json({ success: true, draft: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/momo/replies/execute
 * Admin approves selected replies & dispatches them duplicate-safely
 */
router.post('/replies/execute', async (req, res) => {
  try {
    const { replyIds } = req.body;
    if (!Array.isArray(replyIds) || replyIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of replyIds is required' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const executionResult = await MomoReplyService.executeApprovedReplies(replyIds, req.adminId, ip);

    res.json({
      success: true,
      summary: executionResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/momo/replies/:reply_id/skip
 * Skip a reply draft
 */
router.post('/replies/:reply_id/skip', async (req, res) => {
  try {
    const replyId = Number(req.params.reply_id);
    const drafts = await MomoStorage.getReplyDrafts('all');
    const existing = drafts.find(d => d.id === replyId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reply draft not found' });
    }

    existing.approval_status = 'skipped';
    await MomoStorage.saveReplyDraft(existing);

    res.json({ success: true, draft: existing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Knowledge Base Endpoints (GET and PUT)
 */
router.get('/knowledge-base', async (req, res) => {
  try {
    const kb = await MomoStorage.getKnowledgeBase();
    res.json({ success: true, knowledgeBase: kb });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/knowledge-base/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { title, content, category } = req.body;
    const item = await MomoStorage.saveKnowledgeBaseItem({
      key,
      title,
      content,
      category,
      updated_by_admin: req.adminId
    });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/momo/audit
 * Immutable audit logs
 */
router.get('/audit', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await MomoStorage.getAuditLogs(limit);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/momo/integrations
 * Detailed integration status and setup checklists
 */
router.get('/integrations', async (req, res) => {
  try {
    const meta = await MomoMetaService.getConnectionStatus();
    const ga = await MomoAnalyticsService.getGA4Status();
    res.json({
      success: true,
      integrations: {
        meta_instagram: meta,
        google_analytics: ga
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/momo/integrations/meta/connect
 * Initiate or process Meta connection
 */
router.post('/integrations/meta/connect', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (code) {
      const result = await MomoMetaService.handleOAuthCallback(code, redirectUri);
      return res.json({ success: true, ...result });
    }

    const state = `momo_${Date.now()}`;
    const authUrl = MomoMetaService.getOAuthUrl(redirectUri || `${req.protocol}://${req.get('host')}/admin/momo`, state);
    res.json({
      success: true,
      authUrl,
      configured: Boolean(authUrl)
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/momo/integrations/meta/connect-direct
 * Connect Instagram Business Account directly for @happymoments_india
 */
router.post('/integrations/meta/connect-direct', async (req, res) => {
  try {
    const { accessToken, accountId, username, profileUrl } = req.body;
    const result = await MomoMetaService.connectDirect({
      accessToken,
      accountId,
      username: username || 'happymoments_india',
      profileUrl: profileUrl || 'https://www.instagram.com/happymoments_india/'
    });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await MomoStorage.recordAuditLog({
      action: 'connect_meta_instagram',
      admin_id: req.adminId || 'Bindu',
      ip_address: ip,
      details: {
        account_name: result.accountName,
        profile_url: result.profileUrl
      }
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/momo/integrations/meta/disconnect
 */
router.post('/integrations/meta/disconnect', async (req, res) => {
  try {
    await MomoMetaService.disconnect();
    res.json({ success: true, message: 'Meta Instagram disconnected.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
