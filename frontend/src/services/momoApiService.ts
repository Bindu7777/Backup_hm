import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api/momo`;
const MOMO_SESSION_KEY = 'momo_session_token';

export interface MomoStatusResponse {
  success: boolean;
  service: string;
  version: string;
  sessionValid: boolean;
  adminId: string | null;
  integrations: {
    meta_instagram: string;
    google_analytics: string;
  };
}

export interface MomoVerifyResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  adminId?: string;
  error?: string;
  locked?: boolean;
  remainingSeconds?: number;
}

export interface MomoDashboardData {
  success: boolean;
  integrations: {
    meta_instagram: {
      provider: string;
      status: 'connected' | 'disconnected' | 'expired';
      accountId: string | null;
      accountName: string | null;
      lastSyncAt: string | null;
      grantedPermissions: string[];
      checklist: Array<{ id: string; title: string; description: string; status: 'ready' | 'pending' | 'missing' }>;
      documentationUrl: string;
      metaAppConfigured: boolean;
    };
    google_analytics: {
      provider: string;
      status: 'connected' | 'disconnected';
      propertyId: string | null;
      lastSyncAt: string | null;
      checklist: Array<{ id: string; title: string; description: string; status: 'ready' | 'pending' | 'missing' }>;
      documentationUrl: string;
    };
  };
  metrics: {
    business: {
      totalEnquiries: number;
      enquiryGrowthPct: number | null;
      wonDeals: number;
      lostDeals: number;
      winRate: number;
      pendingReplies: number;
      highIntentLeads: number;
      activeVendors: number;
      categoriesBreakdown: Record<string, number>;
      dailyTrend: Array<{ date: string; inquiries: number; won: number; lost: number }>;
    };
    website: {
      connected: boolean;
      source: string;
      message: string;
      users: number | null;
      sessions: number | null;
      pageViews: number | null;
      trafficSources: any[];
      topLandingPages: any[];
    };
    instagram: {
      connected: boolean;
      hasError?: boolean;
      error?: string;
      metrics?: {
        username: string;
        followers: number | null;
        follows: number | null;
        mediaCount: number | null;
        recentMedia: Array<{
          id: string;
          caption: string;
          media_type: string;
          media_url: string;
          permalink: string;
          timestamp: string;
          like_count: number;
          comments_count: number;
        }>;
        totalRecentLikes: number;
        totalRecentComments: number;
        engagementRate: number | null;
      };
      message?: string;
    };
    period: {
      type: string;
      start: string;
      end: string;
      previousStart: string;
      previousEnd: string;
    };
  };
  report: {
    id: number;
    periodStart: string;
    periodEnd: string;
    periodLabel: string;
    executiveSummary: {
      periodLabel: string;
      overview: string;
      keyChanges: string[];
      customerHighlights: string[];
      immediateAttention: string[];
    };
    instagramAnalysis: {
      connected: boolean;
      accountName: string;
      bestPerformingContent: Array<{ id: string; caption: string; permalink: string; likes: number; comments: number }>;
      engagementThemes: string[];
      recommendations: string[];
    };
    websiteAnalysis: {
      connected: boolean;
      note: string;
      totalEnquiries: number;
      wonDeals: number;
      lostDeals: number;
      winRate: string;
      topCategories: Array<{ category: string; vendorsCount: number }>;
      frictionPoints: string[];
    };
    customerInsights: {
      frequentlyAskedQuestions: string[];
      eventInterests: string[];
      commonObjections: string[];
      estimatedSentiment: { positive: string; neutral: string; urgentOrConcerned: string };
    };
    recommendations: Array<{
      id: string;
      title: string;
      observation: string;
      whyItMatters: string;
      action: string;
      expectedOutcome: string;
      priority: 'high' | 'medium' | 'low';
      confidence: string;
      dataLimitation: string;
    }>;
    dataSourceStatus: {
      internalDatabase: string;
      instagram: string;
      googleAnalytics: string;
    };
    generated_at?: string;
  } | null;
  replyQueue: {
    total: number;
    pending: number;
    blocked: number;
    sent: number;
    drafts: ReplyDraft[];
  };
  knowledgeBaseCount: number;
}

export interface ReplyDraft {
  id: number;
  conversation_id: number;
  incoming_message_id?: number | null;
  original_incoming_message: string;
  suggested_reply: string;
  edited_reply: string;
  detected_intent: string;
  detected_language: string;
  ai_confidence: number;
  escalation_reason?: string | null;
  approval_status: 'pending' | 'approved' | 'sent' | 'skipped' | 'blocked' | 'failed' | 'needs_review';
  messaging_window_valid: boolean;
  block_reason?: string | null;
  participant_name: string;
  participant_id: string;
  provider: string;
  message_timestamp: string;
}

export interface ExecutionSummaryResult {
  totalSelected: number;
  sentCount: number;
  failedCount: number;
  blockedCount: number;
  skippedCount: number;
  details: Array<{
    id: number;
    status: string;
    recipient: string;
    messageId?: string;
    error?: string;
    reason?: string;
  }>;
}

export interface AuditLogItem {
  id?: number;
  actor: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  outcome: string;
  ip_address?: string;
  metadata?: any;
  timestamp: string;
}

export interface KnowledgeBaseItem {
  key: string;
  title: string;
  category: string;
  content: string;
  updated_at?: string;
}

// Session Token Storage (in sessionStorage for security and tab lifecycle)
export const getMomoSessionToken = (): string | null => {
  return sessionStorage.getItem(MOMO_SESSION_KEY);
};

export const setMomoSessionToken = (token: string): void => {
  sessionStorage.setItem(MOMO_SESSION_KEY, token);
};

export const clearMomoSessionToken = (): void => {
  sessionStorage.removeItem(MOMO_SESSION_KEY);
};

// Auth Headers helper
const getHeaders = () => {
  const token = getMomoSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['x-momo-session'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const momoApiService = {
  // Status
  async getStatus(): Promise<MomoStatusResponse> {
    const res = await fetch(`${BASE_URL}/status`, { headers: getHeaders() });
    return res.json();
  },

  // Verify Secret
  async verifySecret(secret: string, adminId: string = 'admin'): Promise<MomoVerifyResponse> {
    const res = await fetch(`${BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, adminId })
    });
    const data = await res.json();
    if (data.success && data.sessionToken) {
      setMomoSessionToken(data.sessionToken);
    }
    return data;
  },

  // Lock Session
  async lockMomo(adminId: string = 'admin'): Promise<{ success: boolean }> {
    try {
      await fetch(`${BASE_URL}/auth/lock`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ adminId })
      });
    } finally {
      clearMomoSessionToken();
    }
    return { success: true };
  },

  // Dashboard
  async getDashboard(period: string = '30d', customStart?: string, customEnd?: string): Promise<MomoDashboardData> {
    let url = `${BASE_URL}/dashboard?period=${period}`;
    if (customStart) url += `&start=${encodeURIComponent(customStart)}`;
    if (customEnd) url += `&end=${encodeURIComponent(customEnd)}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok && res.status === 401) {
      clearMomoSessionToken();
      throw new Error('MOMO_AUTH_REQUIRED');
    }
    return res.json();
  },

  // Refresh Analysis
  async triggerRefresh(options: { periodType?: string; customStart?: string; customEnd?: string } = {}) {
    const res = await fetch(`${BASE_URL}/refresh`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(options)
    });
    if (!res.ok && res.status === 401) {
      clearMomoSessionToken();
      throw new Error('MOMO_AUTH_REQUIRED');
    }
    return res.json();
  },

  // Job progress
  async getJobStatus(jobId: string) {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}`, { headers: getHeaders() });
    return res.json();
  },

  // Update reply draft
  async updateReplyDraft(replyId: number, update: Partial<ReplyDraft>): Promise<{ success: boolean; draft: ReplyDraft }> {
    const res = await fetch(`${BASE_URL}/replies/${replyId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(update)
    });
    return res.json();
  },

  // Skip reply
  async skipReply(replyId: number): Promise<{ success: boolean; draft: ReplyDraft }> {
    const res = await fetch(`${BASE_URL}/replies/${replyId}/skip`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Execute approved replies
  async executeReplies(replyIds: number[]): Promise<{ success: boolean; summary: ExecutionSummaryResult }> {
    const res = await fetch(`${BASE_URL}/replies/execute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ replyIds })
    });
    return res.json();
  },

  // Knowledge base
  async getKnowledgeBase(): Promise<{ success: boolean; knowledgeBase: KnowledgeBaseItem[] }> {
    const res = await fetch(`${BASE_URL}/knowledge-base`, { headers: getHeaders() });
    return res.json();
  },

  async updateKnowledgeBaseItem(key: string, item: Partial<KnowledgeBaseItem>): Promise<{ success: boolean; item: KnowledgeBaseItem }> {
    const res = await fetch(`${BASE_URL}/knowledge-base/${key}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(item)
    });
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(limit: number = 100): Promise<{ success: boolean; logs: AuditLogItem[] }> {
    const res = await fetch(`${BASE_URL}/audit?limit=${limit}`, { headers: getHeaders() });
    return res.json();
  },

  // Integrations
  async getIntegrations() {
    const res = await fetch(`${BASE_URL}/integrations`, { headers: getHeaders() });
    return res.json();
  },

  async connectMeta(redirectUri?: string) {
    const res = await fetch(`${BASE_URL}/integrations/meta/connect`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ redirectUri })
    });
    return res.json();
  },

  async connectInstagramDirect(params: {
    accessToken?: string;
    accountId?: string;
    username?: string;
    profileUrl?: string;
  } = {}) {
    const res = await fetch(`${BASE_URL}/integrations/meta/connect-direct`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async disconnectMeta() {
    const res = await fetch(`${BASE_URL}/integrations/meta/disconnect`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  }
};
