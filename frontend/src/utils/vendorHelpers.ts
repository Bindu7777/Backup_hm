import { Vendor } from '@/lib/supabase';

/**
 * Safely parse or retrieve vendor additional_info object
 */
export const extractVendorAdditionalInfo = (vendor: any): Record<string, any> => {
  if (!vendor || !vendor.additional_info) return {};
  if (typeof vendor.additional_info === 'string') {
    try {
      return JSON.parse(vendor.additional_info);
    } catch {
      return {};
    }
  }
  if (typeof vendor.additional_info === 'object') {
    return vendor.additional_info;
  }
  return {};
};

/**
 * Checks if a vendor is an existing sample/seed vendor.
 * Existing vendors created as placeholder/mock directory data return TRUE.
 * Newly onboarded vendors or real applicants return FALSE.
 */
export const isSampleVendor = (vendor: Vendor | any): boolean => {
  if (!vendor) return false;

  const info = extractVendorAdditionalInfo(vendor);

  // 1. Explicit boolean flag if present
  if (info.is_sample === true || info.sample === true || vendor.is_sample === true) {
    return true;
  }
  if (info.is_sample === false || info.sample === false || vendor.is_sample === false) {
    return false;
  }

  // 2. Real applicants / newly onboarded vendors have onboarding form metadata
  if (
    info.source === 'vendor_onboarding_form' ||
    info.application_id !== undefined ||
    info.application_status !== undefined ||
    info.submitted_at !== undefined
  ) {
    return false;
  }

  // 3. Vendor ID threshold: vendors created during and after onboarding launch (1051+)
  const numericId = Number(vendor.vendor_id);
  if (!isNaN(numericId) && numericId >= 1051) {
    return false;
  }

  // 4. All legacy/seed vendors are sample data
  return true;
};
