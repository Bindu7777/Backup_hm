-- ============================================================================
-- MOMO BOT SCHEMA FOR HAPPY MOMENTS ADMIN PORTAL
-- ============================================================================

-- 1. Admin Sessions Table
CREATE TABLE IF NOT EXISTS public.momo_sessions (
  id BIGSERIAL PRIMARY KEY,
  admin_id VARCHAR(100) NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_momo_sessions_token ON public.momo_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_momo_sessions_admin ON public.momo_sessions(admin_id);

-- 2. Integrations Table (Meta Instagram & Website Analytics)
CREATE TABLE IF NOT EXISTS public.momo_integrations (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL UNIQUE, -- 'meta_instagram', 'google_analytics'
  account_id VARCHAR(150),
  account_name VARCHAR(255),
  encrypted_access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  granted_permissions JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'expired', 'error'
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Metric Snapshots Table
CREATE TABLE IF NOT EXISTS public.momo_metric_snapshots (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL, -- 'instagram', 'website', 'internal_crm'
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  period_type VARCHAR(20) NOT NULL, -- '7d', '30d', 'custom'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_momo_metrics_source_name ON public.momo_metric_snapshots(source, metric_name);
CREATE INDEX IF NOT EXISTS idx_momo_metrics_period ON public.momo_metric_snapshots(period_start, period_end);

-- 4. Conversations Table
CREATE TABLE IF NOT EXISTS public.momo_conversations (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- 'instagram_dm', 'instagram_comment', 'website_inquiry'
  provider_conversation_id VARCHAR(150) NOT NULL UNIQUE,
  participant_id VARCHAR(150) NOT NULL,
  participant_username VARCHAR(150),
  participant_name VARCHAR(255),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latest_message_summary TEXT,
  intent_classification VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
  sentiment VARCHAR(20) DEFAULT 'neutral', -- 'positive', 'neutral', 'negative'
  requires_human_attention BOOLEAN NOT NULL DEFAULT FALSE,
  human_takeover BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_momo_conv_provider_id ON public.momo_conversations(provider_conversation_id);
CREATE INDEX IF NOT EXISTS idx_momo_conv_last_message ON public.momo_conversations(last_message_at DESC);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.momo_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES public.momo_conversations(id) ON DELETE CASCADE,
  provider_message_id VARCHAR(150) UNIQUE,
  sender_type VARCHAR(20) NOT NULL, -- 'customer', 'momo_ai', 'admin'
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eligibility_window_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_momo_msg_conv_id ON public.momo_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_momo_msg_sent_at ON public.momo_messages(sent_at DESC);

-- 6. Reply Drafts Table
CREATE TABLE IF NOT EXISTS public.momo_reply_drafts (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES public.momo_conversations(id) ON DELETE CASCADE,
  incoming_message_id BIGINT REFERENCES public.momo_messages(id) ON DELETE SET NULL,
  original_incoming_message TEXT NOT NULL,
  suggested_reply TEXT NOT NULL,
  edited_reply TEXT,
  detected_intent VARCHAR(100),
  detected_language VARCHAR(50) DEFAULT 'en',
  ai_confidence NUMERIC(3, 2) DEFAULT 0.85,
  escalation_reason TEXT,
  approval_status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'sent', 'skipped', 'blocked', 'failed'
  approved_by_admin VARCHAR(100),
  approved_at TIMESTAMPTZ,
  send_idempotency_key VARCHAR(150) UNIQUE,
  send_attempted_at TIMESTAMPTZ,
  send_result_status VARCHAR(50),
  send_error_message TEXT,
  messaging_window_valid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_momo_replies_conv ON public.momo_reply_drafts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_momo_replies_status ON public.momo_reply_drafts(approval_status);

-- 7. Business Knowledge Base Table
CREATE TABLE IF NOT EXISTS public.momo_knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'business_info', 'pricing', 'onboarding', 'faqs', 'tone_guidelines'
  content TEXT NOT NULL,
  updated_by_admin VARCHAR(100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Analysis Reports Table
CREATE TABLE IF NOT EXISTS public.momo_analysis_reports (
  id BIGSERIAL PRIMARY KEY,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_label VARCHAR(50) NOT NULL,
  executive_summary JSONB NOT NULL,
  instagram_analysis JSONB NOT NULL,
  website_analysis JSONB NOT NULL,
  customer_insights JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  data_source_status JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_momo_reports_generated ON public.momo_analysis_reports(generated_at DESC);

-- 9. Security & Action Audit Logs Table
CREATE TABLE IF NOT EXISTS public.momo_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'auth_verify', 'auth_fail', 'auth_lock', 'refresh_started', 'refresh_completed', 'reply_approved', 'reply_sent', 'reply_failed', 'integration_connected'
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  outcome VARCHAR(30) NOT NULL, -- 'success', 'failure', 'blocked'
  ip_address VARCHAR(45),
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_momo_audit_timestamp ON public.momo_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_momo_audit_action ON public.momo_audit_logs(action);
