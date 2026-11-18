/**
 * likedVendorsApiService.ts
 * --------------------------
 * API service for all Liked-Vendors operations.
 * Every public function uses the centralized logger so calls, responses,
 * timings and errors are always visible in the browser console (F12) and
 * in Vercel runtime logs — including production.
 *
 * Functions:
 *  - saveLikeVendor(customerId, vendorId)   → POST   /api/liked-vendors/save-like
 *  - removeLikeVendor(customerId, vendorId) → DELETE /api/liked-vendors/remove-like
 *  - getLikedVendors(customerId)            → GET    /api/liked-vendors/get-liked-vendors/:id
 *  - checkVendorLiked(customerId, vendorId) → GET    /api/liked-vendors/check-like/:cid/:vid
 */

import { API_BASE_URL as BASE_URL } from '@/config/api';
import { logger } from '@/utils/logger';

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE_URL = `${BASE_URL}/api/liked-vendors`;
const log = logger('LikedVendorsApiService');

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LikedVendorResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  liked_vendor_ids?: string[];
  is_liked?: boolean;
  already_liked?: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
/**
 * Shared fetch wrapper — logs the request, response status, body and timing.
 * Returns null on network/parse failure so callers can handle gracefully.
 */
async function apiFetch(
  fnName: string,
  url: string,
  options: RequestInit
): Promise<{ response: Response; data: any } | null> {
  log.info(fnName, `→ ${options.method} ${url}`, {
    headers: options.headers,
    body: options.body ? JSON.parse(options.body as string) : undefined,
  });

  const start = performance.now();
  try {
    const response = await fetch(url, options);
    const ms = (performance.now() - start).toFixed(1);
    const data = await response.json().catch(() => null);

    log.info(fnName, `← HTTP ${response.status} ${response.statusText} in ${ms}ms`, data);
    return { response, data };
  } catch (err) {
    const ms = (performance.now() - start).toFixed(1);
    log.error(fnName, `✗ Fetch failed after ${ms}ms`, err);
    return null;
  }
}

// ─── saveLikeVendor ───────────────────────────────────────────────────────────
/**
 * Save a like: marks that `customerId` likes `vendorId`.
 *
 * @param customerId  - Numeric ID of the logged-in customer
 * @param vendorId    - UUID string of the vendor being liked
 * @returns LikedVendorResponse with success flag
 */
export const saveLikeVendor = async (
  customerId: number,
  vendorId: string
): Promise<LikedVendorResponse> => {
  const FN = 'saveLikeVendor';
  log.info(FN, 'Called', { customerId, vendorId, timestamp: new Date().toISOString() });

  const result = await apiFetch(FN, `${API_BASE_URL}/save-like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId, vendor_id: vendorId }),
  });

  // Network / parse failure
  if (!result) {
    log.error(FN, 'Network error — could not reach server');
    return { success: false, error: 'Network error: could not reach server' };
  }

  const { response, data } = result;

  // HTTP error from backend
  if (!response.ok) {
    log.error(FN, `Backend rejected save-like (HTTP ${response.status})`, data);
    return {
      success: false,
      error: data?.error || `HTTP ${response.status}: Failed to save like`,
    };
  }

  // Duplicate like (already liked)
  if (data?.already_liked) {
    log.warn(FN, 'Vendor already liked — no action needed', { customerId, vendorId });
    return data;
  }

  log.success(FN, 'Like saved successfully', { customerId, vendorId });
  return data;
};

// ─── removeLikeVendor ─────────────────────────────────────────────────────────
/**
 * Remove a like: unmarks that `customerId` likes `vendorId`.
 *
 * @param customerId  - Numeric ID of the logged-in customer
 * @param vendorId    - UUID string of the vendor being un-liked
 * @returns LikedVendorResponse with success flag
 */
export const removeLikeVendor = async (
  customerId: number,
  vendorId: string
): Promise<LikedVendorResponse> => {
  const FN = 'removeLikeVendor';
  log.info(FN, 'Called', { customerId, vendorId, timestamp: new Date().toISOString() });

  const result = await apiFetch(FN, `${API_BASE_URL}/remove-like`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId, vendor_id: vendorId }),
  });

  if (!result) {
    log.error(FN, 'Network error — could not reach server');
    return { success: false, error: 'Network error - please check your connection' };
  }

  const { response, data } = result;

  if (!response.ok) {
    log.error(FN, `Backend rejected remove-like (HTTP ${response.status})`, data);
    return {
      success: false,
      error: data?.error || 'Failed to remove like',
    };
  }

  log.success(FN, 'Like removed successfully', { customerId, vendorId });
  return data;
};

// ─── getLikedVendors ──────────────────────────────────────────────────────────
/**
 * Fetch all vendors that `customerId` has liked.
 *
 * @param customerId  - Numeric ID of the logged-in customer
 * @returns LikedVendorResponse with `data` array of vendor objects
 */
export const getLikedVendors = async (
  customerId: number
): Promise<LikedVendorResponse> => {
  const FN = 'getLikedVendors';
  log.info(FN, 'Called', { customerId, timestamp: new Date().toISOString() });

  if (!customerId || customerId === 0) {
    log.warn(FN, 'customerId is 0 or missing — aborting fetch', { customerId });
    return { success: false, error: 'Invalid customer ID' };
  }

  const result = await apiFetch(FN, `${API_BASE_URL}/get-liked-vendors/${customerId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!result) {
    log.error(FN, 'Network error — could not reach server');
    return { success: false, error: 'Network error - please check your connection' };
  }

  const { response, data } = result;

  if (!response.ok) {
    log.error(FN, `Backend rejected get-liked-vendors (HTTP ${response.status})`, data);
    return {
      success: false,
      error: data?.error || 'Failed to get liked vendors',
    };
  }

  const count = Array.isArray(data?.data) ? data.data.length : 0;
  log.success(FN, `Fetched ${count} liked vendor(s) for customer ${customerId}`, {
    vendorCount: count,
  });
  return data;
};

// ─── checkVendorLiked ─────────────────────────────────────────────────────────
/**
 * Check whether `customerId` has already liked `vendorId`.
 *
 * @param customerId  - Numeric ID of the logged-in customer
 * @param vendorId    - UUID string of the vendor to check
 * @returns LikedVendorResponse with `is_liked` boolean
 */
export const checkVendorLiked = async (
  customerId: number,
  vendorId: string
): Promise<LikedVendorResponse> => {
  const FN = 'checkVendorLiked';
  log.info(FN, 'Called', { customerId, vendorId, timestamp: new Date().toISOString() });

  const result = await apiFetch(
    FN,
    `${API_BASE_URL}/check-like/${customerId}/${vendorId}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );

  if (!result) {
    log.error(FN, 'Network error — could not reach server');
    return { success: false, error: 'Network error - please check your connection' };
  }

  const { response, data } = result;

  if (!response.ok) {
    log.error(FN, `Backend rejected check-like (HTTP ${response.status})`, data);
    return {
      success: false,
      error: data?.error || 'Failed to check like status',
    };
  }

  log.success(FN, `Vendor ${vendorId} is_liked=${data?.is_liked} for customer ${customerId}`);
  return data;
};
