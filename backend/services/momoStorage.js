const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/supabase');

const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'momo_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial knowledge base seed for Happy Moments
const DEFAULT_KNOWLEDGE_BASE = [
  {
    key: 'business_overview',
    title: 'Happy Moments Platform Overview',
    category: 'business_info',
    content: 'Happy Moments (happymomentsindia.com) is Hyderabad and Telangana premier event management and vendor marketplace. We connect event hosts with top-rated, verified event planners, wedding decorators, candid photographers, bridal makeup artists, catering, and exclusive event spaces/mandapas. Support contact: support@happymomentsindia.com. Operating hours: 9:00 AM - 8:00 PM IST daily.',
    updated_at: new Date().toISOString()
  },
  {
    key: 'services_and_pricing',
    title: 'Verified Services & Budget Estimates',
    category: 'pricing',
    content: '1. Event Planners: Full management starting from ₹25,000 to ₹1,50,000 depending on event scale.\n2. Mandapas & Convention Halls: Capacity from 15 to 2,000+ guests. Starting from ₹8,000 up to ₹2,50,000 per day.\n3. Wedding & Stage Decor: Floral, themed, and contemporary setups starting from ₹15,000 up to ₹2,00,000.\n4. Photography & Cinematography: Pre-wedding, traditional + candid coverage starting from ₹20,000 up to ₹1,20,000.\n5. Bridal Makeup: HD/Airbrush makeup packages starting from ₹8,000 up to ₹35,000.\nNote: Prices are customized based on date, venue location in Hyderabad, and customer customization. Never commit to a discount or guarantee a booking without vendor confirmation.',
    updated_at: new Date().toISOString()
  },
  {
    key: 'vendor_onboarding',
    title: 'Vendor Onboarding & Partnership',
    category: 'onboarding',
    content: 'Vendors can register directly at happymomentsindia.com/business or through our WhatsApp vendor onboarding hub. Registration requires: Brand name, SPOC contact, portfolio photos/Instagram handle, pricing tiers, and service locations. Verification usually takes 24 to 48 hours.',
    updated_at: new Date().toISOString()
  },
  {
    key: 'faqs',
    title: 'Frequently Asked Questions',
    category: 'faqs',
    content: 'Q: How do I book a vendor?\nA: You can explore verified profiles on Happy Moments, request a callback or quotation directly, and our team connects you directly with the SPOC.\nQ: Are vendor prices negotiable?\nA: Yes, packages can be tailored depending on guest count and custom needs.\nQ: Can Happy Moments help coordinate multiple vendors?\nA: Yes, our dedicated concierge team assists with multi-vendor coordination.',
    updated_at: new Date().toISOString()
  },
  {
    key: 'tone_and_language',
    title: 'Approved Tone & Language Preferences',
    category: 'tone_guidelines',
    content: 'Tone must be warm, celebratory, respectful, professional, and courteous. Support both fluent English and polite Telugu (Namaskaram / Dhanyavadalu) as appropriate to the customer query. Never invent prices or vendor availability. If a customer is frustrated or has an existing booking complaint, escalate immediately for human attention.',
    updated_at: new Date().toISOString()
  }
];

// Helper to initialize local store
function loadLocalStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      const initialData = {
        sessions: [],
        integrations: {
          meta_instagram: {
            provider: 'meta_instagram',
            status: 'disconnected',
            account_id: null,
            account_name: null,
            granted_permissions: [],
            last_sync_at: null,
            metadata: {
              app_id: process.env.META_CLIENT_ID || null,
              setup_guide_url: 'https://developers.facebook.com/docs/instagram-platform/'
            }
          },
          google_analytics: {
            provider: 'google_analytics',
            status: 'disconnected',
            account_id: null,
            account_name: null,
            property_id: process.env.GA4_PROPERTY_ID || null,
            last_sync_at: null,
            metadata: {
              measurement_id: process.env.GA4_MEASUREMENT_ID || null
            }
          }
        },
        metric_snapshots: [],
        conversations: [],
        messages: [],
        reply_drafts: [],
        reports: [],
        knowledge_base: DEFAULT_KNOWLEDGE_BASE,
        audit_logs: [],
        jobs: {}
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), 'utf8');
      return initialData;
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local momo store:', err);
    return {
      sessions: [],
      integrations: {},
      metric_snapshots: [],
      conversations: [],
      messages: [],
      reply_drafts: [],
      reports: [],
      knowledge_base: DEFAULT_KNOWLEDGE_BASE,
      audit_logs: [],
      jobs: {}
    };
  }
}

function saveLocalStore(data) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write local momo store:', err);
  }
}

// Track whether Supabase table exists
let hasCheckedSupabase = false;
let supabaseTableAvailable = false;
let checkSupabasePromise = null;

async function checkSupabaseAvailable() {
  if (hasCheckedSupabase) return supabaseTableAvailable;
  if (checkSupabasePromise) return checkSupabasePromise;

  checkSupabasePromise = (async () => {
    try {
      const { error } = await supabase.from('momo_integrations').select('id').limit(1);
      supabaseTableAvailable = !error;
    } catch (e) {
      supabaseTableAvailable = false;
    }
    hasCheckedSupabase = true;
    return supabaseTableAvailable;
  })();

  return checkSupabasePromise;
}

const MomoStorage = {
  // Session management
  async createSession(session) {
    const isSupabase = await checkSupabaseAvailable();
    if (isSupabase) {
      const { data, error } = await supabase.from('momo_sessions').insert(session).select().single();
      if (!error && data) return data;
    }
    const store = loadLocalStore();
    store.sessions = (store.sessions || []).filter(s => s.session_token !== session.session_token);
    store.sessions.push(session);
    saveLocalStore(store);
    return session;
  },

  async getSession(token) {
    if (!token) return null;
    const isSupabase = await checkSupabaseAvailable();
    if (isSupabase) {
      const { data, error } = await supabase
        .from('momo_sessions')
        .select('*')
        .eq('session_token', token)
        .eq('is_revoked', false)
        .single();
      if (!error && data) return data;
    }
    const store = loadLocalStore();
    const session = (store.sessions || []).find(s => s.session_token === token && !s.is_revoked);
    return session || null;
  },

  async touchSession(token) {
    const isSupabase = await checkSupabaseAvailable();
    const now = new Date().toISOString();
    if (isSupabase) {
      await supabase.from('momo_sessions').update({ last_activity_at: now }).eq('session_token', token);
    }
    const store = loadLocalStore();
    const session = (store.sessions || []).find(s => s.session_token === token);
    if (session) {
      session.last_activity_at = now;
      saveLocalStore(store);
    }
  },

  async revokeSession(token) {
    const isSupabase = await checkSupabaseAvailable();
    if (isSupabase) {
      await supabase.from('momo_sessions').update({ is_revoked: true }).eq('session_token', token);
    }
    const store = loadLocalStore();
    const session = (store.sessions || []).find(s => s.session_token === token);
    if (session) {
      session.is_revoked = true;
      saveLocalStore(store);
    }
  },

  // Integrations
  async getIntegrations() {
    const isSupabase = await checkSupabaseAvailable();
    if (isSupabase) {
      const { data, error } = await supabase.from('momo_integrations').select('*');
      if (!error && data && data.length > 0) {
        return data.reduce((acc, curr) => {
          acc[curr.provider] = curr;
          return acc;
        }, {});
      }
    }
    const store = loadLocalStore();
    return store.integrations || {};
  },

  async saveIntegration(provider, payload) {
    const isSupabase = await checkSupabaseAvailable();
    const now = new Date().toISOString();
    const record = {
      provider,
      ...payload,
      updated_at: now
    };

    if (isSupabase) {
      const { data, error } = await supabase
        .from('momo_integrations')
        .upsert(record, { onConflict: 'provider' })
        .select()
        .single();
      if (!error && data) return data;
    }

    const store = loadLocalStore();
    store.integrations = store.integrations || {};
    store.integrations[provider] = {
      ...(store.integrations[provider] || {}),
      ...record
    };
    saveLocalStore(store);
    return store.integrations[provider];
  },

  // Knowledge Base
  async getKnowledgeBase() {
    const isSupabase = await checkSupabaseAvailable();
    if (isSupabase) {
      const { data, error } = await supabase.from('momo_knowledge_base').select('*').order('category');
      if (!error && data && data.length > 0) return data;
    }
    const store = loadLocalStore();
    return store.knowledge_base || DEFAULT_KNOWLEDGE_BASE;
  },

  async saveKnowledgeBaseItem(item) {
    const isSupabase = await checkSupabaseAvailable();
    item.updated_at = new Date().toISOString();
    if (isSupabase) {
      const { data, error } = await supabase
        .from('momo_knowledge_base')
        .upsert(item, { onConflict: 'key' })
        .select()
        .single();
      if (!error && data) return data;
    }
    const store = loadLocalStore();
    store.knowledge_base = store.knowledge_base || [];
    const idx = store.knowledge_base.findIndex(k => k.key === item.key);
    if (idx >= 0) {
      store.knowledge_base[idx] = { ...store.knowledge_base[idx], ...item };
    } else {
      store.knowledge_base.push(item);
    }
    saveLocalStore(store);
    return item;
  },

  // Audit Logs
  async logAudit(entry) {
    const logItem = {
      actor: entry.actor || 'admin',
      action: entry.action,
      resource_type: entry.resource_type || null,
      resource_id: entry.resource_id ? String(entry.resource_id) : null,
      outcome: entry.outcome || 'success',
      ip_address: entry.ip_address || null,
      metadata: entry.metadata || {},
      timestamp: new Date().toISOString()
    };

    const isSupabase = await checkSupabaseAvailable();
    if (isSupabase) {
      try {
        await supabase.from('momo_audit_logs').insert(logItem);
      } catch (e) {
        console.error('Supabase audit log error:', e);
      }
    }

    const store = loadLocalStore();
    store.audit_logs = store.audit_logs || [];
    store.audit_logs.unshift(logItem);
    // Keep max 500 audit logs
    if (store.audit_logs.length > 500) {
      store.audit_logs = store.audit_logs.slice(0, 500);
    }
    saveLocalStore(store);
    return logItem;
  },

  async getAuditLogs(limit = 100) {
    const isSupabase = await checkSupabaseAvailable();
    if (isSupabase) {
      const { data, error } = await supabase
        .from('momo_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      if (!error && data) return data;
    }
    const store = loadLocalStore();
    return (store.audit_logs || []).slice(0, limit);
  },

  // Conversations & Reply Drafts
  async getConversations(filters = {}) {
    const store = loadLocalStore();
    return store.conversations || [];
  },

  async saveConversation(conv) {
    const store = loadLocalStore();
    store.conversations = store.conversations || [];
    const idx = store.conversations.findIndex(c => c.provider_conversation_id === conv.provider_conversation_id);
    if (idx >= 0) {
      store.conversations[idx] = { ...store.conversations[idx], ...conv, updated_at: new Date().toISOString() };
    } else {
      store.conversations.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        ...conv,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    saveLocalStore(store);
    return conv;
  },

  async getReplyDrafts(status = 'pending') {
    const store = loadLocalStore();
    let drafts = store.reply_drafts || [];
    if (status && status !== 'all') {
      drafts = drafts.filter(d => d.approval_status === status);
    }
    return drafts;
  },

  async saveReplyDraft(draft) {
    const store = loadLocalStore();
    store.reply_drafts = store.reply_drafts || [];
    const idx = store.reply_drafts.findIndex(d => d.id === draft.id);
    if (idx >= 0) {
      store.reply_drafts[idx] = { ...store.reply_drafts[idx], ...draft, updated_at: new Date().toISOString() };
      saveLocalStore(store);
      return store.reply_drafts[idx];
    } else {
      const newDraft = {
        id: draft.id || Date.now() + Math.floor(Math.random() * 1000),
        ...draft,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      store.reply_drafts.push(newDraft);
      saveLocalStore(store);
      return newDraft;
    }
  },

  // Reports
  async getLatestReport() {
    const store = loadLocalStore();
    if (store.reports && store.reports.length > 0) {
      return store.reports[0];
    }
    return null;
  },

  async saveReport(report) {
    const store = loadLocalStore();
    store.reports = store.reports || [];
    const reportItem = {
      id: Date.now(),
      ...report,
      generated_at: new Date().toISOString()
    };
    store.reports.unshift(reportItem);
    if (store.reports.length > 20) {
      store.reports = store.reports.slice(0, 20);
    }
    saveLocalStore(store);
    return reportItem;
  },

  // Background Refresh Jobs
  getJob(jobId) {
    const store = loadLocalStore();
    return (store.jobs || {})[jobId] || null;
  },

  saveJob(jobId, jobData) {
    const store = loadLocalStore();
    store.jobs = store.jobs || {};
    store.jobs[jobId] = {
      ...(store.jobs[jobId] || {}),
      ...jobData,
      updated_at: new Date().toISOString()
    };
    saveLocalStore(store);
    return store.jobs[jobId];
  }
};

module.exports = { MomoStorage, DEFAULT_KNOWLEDGE_BASE };
