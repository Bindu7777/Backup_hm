-- ==============================================================================
-- HAPPY MOMENTS: VENDOR ONBOARDING & APPLICATION SCHEMA MIGRATION (FIXED)
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> Run)
-- ==============================================================================

-- 1. Ensure required columns exist on the 'vendors' table (both category and categories)
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS categories TEXT[],
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS experience TEXT,
  ADD COLUMN IF NOT EXISTS starting_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quick_intro TEXT,
  ADD COLUMN IF NOT EXISTS detailed_intro TEXT,
  ADD COLUMN IF NOT EXISTS additional_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS currently_available BOOLEAN DEFAULT FALSE;

-- 2. Create indexes for fast filtering on vendors
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors(verified);
CREATE INDEX IF NOT EXISTS idx_vendors_additional_info ON vendors USING GIN (additional_info);

-- 3. Ensure 'admin_notifications' table exists for onboarding alerts
CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGSERIAL PRIMARY KEY,
  vendor_id TEXT,
  notification_type TEXT DEFAULT 'new_vendor_application',
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread 
  ON admin_notifications(is_read, created_at DESC);

-- 4. Ensure 'vendor_media' table exists AND has 'category' column
-- (If the table already existed previously without 'category', this ALTER adds it first)
CREATE TABLE IF NOT EXISTS vendor_media (
  id BIGSERIAL PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  category TEXT DEFAULT 'catalog',
  title TEXT,
  description TEXT,
  alt_text TEXT,
  public BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crucial: Explicitly ensure 'category' column exists on vendor_media if table was pre-existing
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'catalog';
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS public BOOLEAN DEFAULT TRUE;

-- Now safe to create index
CREATE INDEX IF NOT EXISTS idx_vendor_media_vendor 
  ON vendor_media(vendor_id, category);

-- 5. Enable Storage bucket for vendor images & logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-images', 'vendor-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Public Access for Vendor Images'
  ) THEN
    CREATE POLICY "Public Access for Vendor Images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'vendor-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow Uploads to Vendor Images'
  ) THEN
    CREATE POLICY "Allow Uploads to Vendor Images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'vendor-images');
  END IF;
END $$;

-- 6. Convenient View: See all pending vendor applications at a glance
DROP VIEW IF EXISTS pending_vendor_applications_view;

CREATE OR REPLACE VIEW pending_vendor_applications_view AS
SELECT
  v.vendor_id,
  v.brand_name,
  v.spoc_name,
  v.phone_number,
  v.whatsapp_number,
  v.email,
  v.address,
  COALESCE(v.category::text, '') AS category,
  v.experience,
  v.starting_price,
  v.additional_info->>'application_id' AS application_id,
  v.additional_info->>'application_status' AS application_status,
  v.additional_info->>'city' AS city,
  v.additional_info->>'state' AS state,
  v.additional_info->>'areas_served' AS areas_served,
  v.additional_info->>'pricing_type' AS pricing_type,
  v.additional_info->>'preferred_contact_method' AS preferred_contact_method,
  v.additional_info->>'best_time_to_contact' AS best_time_to_contact,
  v.additional_info->>'portfolio_links' AS portfolio_links,
  v.verified,
  v.created_at AS submitted_at
FROM vendors v
WHERE v.verified = FALSE 
  AND (v.additional_info->>'application_status' = 'Pending review' OR v.additional_info->>'source' = 'vendor_onboarding_form')
ORDER BY v.created_at DESC;
