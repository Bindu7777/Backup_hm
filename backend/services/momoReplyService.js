const crypto = require('crypto');
const { MomoStorage } = require('./momoStorage');
const { MomoMetaService } = require('./momoMetaService');

// 24-Hour window in ms
const META_24H_WINDOW_MS = 24 * 60 * 60 * 1000;

// Intent classifications
const INTENT_CLASSIFICATIONS = [
  'Event booking enquiry',
  'Decoration enquiry',
  'Photography enquiry',
  'Makeup enquiry',
  'Venue enquiry',
  'Vendor onboarding',
  'Pricing question',
  'Partnership enquiry',
  'Complaint',
  'Existing booking support',
  'Spam or irrelevant message',
  'Other'
];

const MomoReplyService = {
  /**
   * Classify intent of an incoming customer message
   */
  classifyIntent(messageText) {
    if (!messageText) return { intent: 'Other', confidence: 0.5 };
    const lower = messageText.toLowerCase();

    if (lower.includes('complaint') || lower.includes('worst') || lower.includes('cheated') || lower.includes('refund') || lower.includes('bad service')) {
      return { intent: 'Complaint', confidence: 0.95, requiresHumanAttention: true };
    }
    if (lower.includes('onboard') || lower.includes('register as vendor') || lower.includes('vendor registration') || lower.includes('partner with')) {
      return { intent: 'Vendor onboarding', confidence: 0.92 };
    }
    if (lower.includes('decor') || lower.includes('flower') || lower.includes('stage') || lower.includes('mandap decor') || lower.includes('balloon')) {
      return { intent: 'Decoration enquiry', confidence: 0.9 };
    }
    if (lower.includes('photo') || lower.includes('video') || lower.includes('shoot') || lower.includes('candid') || lower.includes('album')) {
      return { intent: 'Photography enquiry', confidence: 0.9 };
    }
    if (lower.includes('makeup') || lower.includes('bridal') || lower.includes('hair') || lower.includes('mehendi')) {
      return { intent: 'Makeup enquiry', confidence: 0.9 };
    }
    if (lower.includes('venue') || lower.includes('hall') || lower.includes('mandapam') || lower.includes('convention') || lower.includes('lawn') || lower.includes('capacity')) {
      return { intent: 'Venue enquiry', confidence: 0.88 };
    }
    if (lower.includes('price') || lower.includes('cost') || lower.includes('package') || lower.includes('how much') || lower.includes('charges')) {
      return { intent: 'Pricing question', confidence: 0.88 };
    }
    if (lower.includes('book') || lower.includes('wedding date') || lower.includes('available on') || lower.includes('reception') || lower.includes('birthday')) {
      return { intent: 'Event booking enquiry', confidence: 0.87 };
    }
    if (lower.includes('status') || lower.includes('my booking') || lower.includes('update on my')) {
      return { intent: 'Existing booking support', confidence: 0.85 };
    }
    if (lower.includes('crypto') || lower.includes('loan') || lower.includes('telegram') || lower.includes('earn money')) {
      return { intent: 'Spam or irrelevant message', confidence: 0.98 };
    }

    return { intent: 'Event booking enquiry', confidence: 0.75 };
  },

  /**
   * Detect if language contains Telugu or English
   */
  detectLanguage(text) {
    if (!text) return 'en';
    const teluguRegex = /[\u0C00-\u0C7F]/;
    if (teluguRegex.test(text)) return 'te';
    const lower = text.toLowerCase();
    if (lower.includes('namaskaram') || lower.includes('kavali') || lower.includes('unnara') || lower.includes('dhanyavadalu')) {
      return 'te-latn';
    }
    return 'en';
  },

  /**
   * Draft a grounded reply using knowledge base and conversation context
   */
  async draftReply(conversation, incomingMessage) {
    const text = incomingMessage.content || '';
    const { intent, confidence, requiresHumanAttention } = this.classifyIntent(text);
    const lang = this.detectLanguage(text);

    // Check 24h eligibility window
    const messageTime = new Date(incomingMessage.sent_at || Date.now()).getTime();
    const now = Date.now();
    const isWithin24Hours = (now - messageTime) <= META_24H_WINDOW_MS;

    let suggestedReply = '';
    let escalationReason = null;

    if (requiresHumanAttention || intent === 'Complaint') {
      escalationReason = 'Customer expressed grievance or requires high-touch dispute resolution.';
      suggestedReply = lang === 'te'
        ? 'నమస్కారం, మీ అసౌకర్యానికి చింతిస్తున్నాము. మా సీనియర్ మేనేజర్ మీతో త్వరలోనే నేరుగా మాట్లాడి పరిష్కరిస్తారు. దయచేసి మీ కాంటాక్ట్ నంబర్ తెలియజేయండి.'
        : 'Hello, we sincerely apologize for the inconvenience. Our senior concierge manager is reviewing your case and will call you directly. Please share your preferred contact number.';
    } else if (intent === 'Vendor onboarding') {
      suggestedReply = lang === 'te'
        ? 'నమస్కారం! హ్యాపీ మూమెంట్స్ (Happy Moments) లో వెండర్‌గా నమోదు చేసుకోవడానికి స్వాగతం. మీరు happymomentsindia.com/business లింక్ ద్వారా 2 నిమిషాల్లో వివరాలు నమోదు చేయవచ్చు. మా టీమ్ వెరిఫికేషన్ చేసి 24 గంటల్లో మీ ప్రొఫైల్ ఆక్టివేట్ చేస్తుంది.'
        : 'Hello! Thank you for your interest in joining Happy Moments India. You can register your vendor business at happymomentsindia.com/business. Our partner onboarding team will verify your portfolio and activate your listing within 24-48 hours.';
    } else if (intent === 'Decoration enquiry' || intent === 'Photography enquiry' || intent === 'Venue enquiry' || intent === 'Makeup enquiry') {
      suggestedReply = lang === 'te'
        ? `నమస్కారం! మీ ఈవెంట్ కోసం హ్యాపీ మూమెంట్స్ వెరిఫైడ్ నిపుణులు అందుబాటులో ఉన్నారు. మా వెబ్‌సైట్ happymomentsindia.com లో ఫోటోలు మరియు బడ్జెట్ ప్యాకేజీలు చూడవచ్చు. మీ ఈవెంట్ తేదీ మరియు హైదరాబాద్‌లోని లొకేషన్ వివరాలు పంపగలరా?`
        : `Hi there! Thank you for reaching out to Happy Moments India. We have verified ${intent.replace(' enquiry', '')} specialists across Hyderabad with verified customer reviews. Could you share your event date, approximate guest count, and venue location so we can recommend the best available packages?`;
    } else if (intent === 'Pricing question') {
      suggestedReply = 'Hi! Our packages are tailored to your event requirements and scale. You can browse verified starting prices across event planners, stage decor, and photography directly on happymomentsindia.com/vendors. If you share your event date and budget, our team can curate matching options for you!';
    } else if (intent === 'Spam or irrelevant message') {
      suggestedReply = '';
      escalationReason = 'Spam or unsolicited non-event message detected.';
    } else {
      suggestedReply = 'Hello! Thank you for reaching out to Happy Moments India. How can we assist you with your upcoming celebration in Hyderabad today?';
    }

    const draft = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      conversation_id: conversation.id,
      incoming_message_id: incomingMessage.id || null,
      original_incoming_message: text,
      suggested_reply: suggestedReply,
      edited_reply: suggestedReply,
      detected_intent: intent,
      detected_language: lang,
      ai_confidence: confidence,
      escalation_reason: escalationReason,
      approval_status: !isWithin24Hours ? 'blocked' : (escalationReason ? 'needs_review' : 'pending'),
      messaging_window_valid: isWithin24Hours,
      block_reason: !isWithin24Hours ? 'Expired: Exceeds Meta 24-hour customer messaging policy window.' : null,
      participant_name: conversation.participant_name || conversation.participant_username || 'Customer',
      participant_id: conversation.participant_id,
      provider: conversation.provider || 'instagram_dm',
      message_timestamp: incomingMessage.sent_at || new Date().toISOString()
    };

    await MomoStorage.saveReplyDraft(draft);
    return draft;
  },

  /**
   * Execute batch approval and sending of approved replies
   */
  async executeApprovedReplies(approvedReplyIds, adminId, ip) {
    const allDrafts = await MomoStorage.getReplyDrafts('all');
    const targetDrafts = allDrafts.filter(d => approvedReplyIds.includes(d.id));

    const results = {
      totalSelected: targetDrafts.length,
      sentCount: 0,
      failedCount: 0,
      blockedCount: 0,
      skippedCount: 0,
      details: []
    };

    for (const draft of targetDrafts) {
      // 1. Re-check messaging window eligibility in real time
      const messageTime = new Date(draft.message_timestamp).getTime();
      const now = Date.now();
      const isStillValid = (now - messageTime) <= META_24H_WINDOW_MS;

      if (!isStillValid) {
        draft.approval_status = 'blocked';
        draft.messaging_window_valid = false;
        draft.send_error_message = '24-hour messaging window expired before dispatch.';
        await MomoStorage.saveReplyDraft(draft);

        results.blockedCount += 1;
        results.details.push({
          id: draft.id,
          status: 'blocked',
          recipient: draft.participant_name,
          reason: '24-hour messaging window expired.'
        });

        await MomoStorage.logAudit({
          actor: adminId || 'admin',
          action: 'reply_blocked',
          resource_type: 'reply_draft',
          resource_id: draft.id,
          outcome: 'blocked',
          ip_address: ip,
          metadata: { reason: 'Exceeded 24h Meta policy window', participant: draft.participant_name }
        });
        continue;
      }

      // 2. Generate unique idempotency key
      const idempotencyKey = `send_${draft.id}_${crypto.randomBytes(6).toString('hex')}`;
      const replyContent = draft.edited_reply || draft.suggested_reply;

      // 3. Send through Meta Service
      const sendRes = await MomoMetaService.sendApprovedReply(
        draft.participant_id,
        replyContent,
        idempotencyKey
      );

      if (sendRes.sent) {
        draft.approval_status = 'sent';
        draft.send_idempotency_key = idempotencyKey;
        draft.send_attempted_at = new Date().toISOString();
        draft.send_result_status = 'sent';
        draft.approved_by_admin = adminId;
        await MomoStorage.saveReplyDraft(draft);

        results.sentCount += 1;
        results.details.push({
          id: draft.id,
          status: 'sent',
          recipient: draft.participant_name,
          messageId: sendRes.messageId
        });

        await MomoStorage.logAudit({
          actor: adminId || 'admin',
          action: 'reply_sent',
          resource_type: 'reply_draft',
          resource_id: draft.id,
          outcome: 'success',
          ip_address: ip,
          metadata: { messageId: sendRes.messageId, recipient: draft.participant_name }
        });
      } else if (sendRes.blocked) {
        draft.approval_status = 'blocked';
        draft.send_error_message = sendRes.reason;
        await MomoStorage.saveReplyDraft(draft);

        results.blockedCount += 1;
        results.details.push({
          id: draft.id,
          status: 'blocked',
          recipient: draft.participant_name,
          reason: sendRes.reason
        });

        await MomoStorage.logAudit({
          actor: adminId || 'admin',
          action: 'reply_blocked',
          resource_type: 'reply_draft',
          resource_id: draft.id,
          outcome: 'blocked',
          ip_address: ip,
          metadata: { reason: sendRes.reason }
        });
      } else {
        draft.approval_status = 'failed';
        draft.send_error_message = sendRes.error;
        await MomoStorage.saveReplyDraft(draft);

        results.failedCount += 1;
        results.details.push({
          id: draft.id,
          status: 'failed',
          recipient: draft.participant_name,
          error: sendRes.error
        });

        await MomoStorage.logAudit({
          actor: adminId || 'admin',
          action: 'reply_failed',
          resource_type: 'reply_draft',
          resource_id: draft.id,
          outcome: 'failure',
          ip_address: ip,
          metadata: { error: sendRes.error }
        });
      }
    }

    return results;
  }
};

module.exports = { MomoReplyService };
