-- ==============================================================================
-- HAPPY MOMENTS: ONBOARDED VENDORS DATABASE VIEW & TRACKING SCHEMA
-- ==============================================================================

-- 1. Ensure indexes for onboarded vendors tracking
CREATE INDEX IF NOT EXISTS idx_vendors_is_onboarded 
  ON vendors (((additional_info->>'is_onboarded')::boolean));

CREATE INDEX IF NOT EXISTS idx_vendors_app_status 
  ON vendors ((additional_info->>'application_status'));

CREATE INDEX IF NOT EXISTS idx_vendors_is_sample 
  ON vendors (((additional_info->>'is_sample')::boolean));

-- 2. Create official 'onboarded_vendors' database view
DROP VIEW IF EXISTS public.onboarded_vendors;

CREATE OR REPLACE VIEW public.onboarded_vendors AS
SELECT
  v.vendor_id,
  v.brand_name,
  v.spoc_name,
  v.phone_number,
  v.whatsapp_number,
  v.email,
  v.address,
  COALESCE(v.category::text, '') AS category,
  v.categories,
  v.experience,
  v.starting_price,
  v.verified,
  v.currently_available,
  v.additional_info->>'application_id' AS application_id,
  v.additional_info->>'application_status' AS application_status,
  COALESCE((v.additional_info->>'is_sample')::boolean, FALSE) AS is_sample,
  COALESCE((v.additional_info->>'is_onboarded')::boolean, TRUE) AS is_onboarded,
  v.additional_info->>'onboarding_stage' AS onboarding_stage,
  v.additional_info->>'credentials_username' AS login_username,
  vc.password AS login_password,
  v.additional_info->>'onboarded_at' AS onboarded_at,
  v.created_at
FROM public.vendors v
LEFT JOIN public.vendor_credentials vc ON vc.vendor_id = v.vendor_id
WHERE 
  (v.additional_info->>'is_onboarded')::boolean = TRUE
  OR (v.additional_info->>'is_sample')::boolean = FALSE
  OR v.vendor_id IN (1060, 1064, 1067, 1068, 1069, 1070, 1071, 1072, 1073);

COMMENT ON VIEW public.onboarded_vendors IS 'Official view of all approved real onboarded vendors on Happy Moments';
