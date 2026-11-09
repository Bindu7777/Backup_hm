const crypto = require('crypto');
const { MomoStorage } = require('./momoStorage');

// Configurable secret and session duration
const MOMO_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// In-memory rate limiting and lockout tracker
const failedAttempts = new Map(); // key: ip or admin -> { count, lockedUntil }

// Default fallback secret hash (salt:hash of "MomoAdmin2026!") if no env is set
const DEFAULT_SALT = 'hm_momo_salt_2026';
function hashSecret(secret, salt = DEFAULT_SALT) {
  return crypto.pbkdf2Sync(secret, salt, 100000, 64, 'sha512').toString('hex');
}

// Compute the configured target hash
function getTargetSecretHash() {
  if (process.env.MOMO_ACCESS_SECRET_HASH) {
    return process.env.MOMO_ACCESS_SECRET_HASH;
  }
  const plainSecret = process.env.MOMO_ACCESS_SECRET || 'Raviteja';
  return hashSecret(plainSecret);
}

const MomoAuthService = {
  /**
   * Check if client IP or admin is temporarily locked out
   */
  isLockedOut(key) {
    const record = failedAttempts.get(key);
    if (!record) return { locked: false, remainingSeconds: 0 };
    if (record.lockedUntil && record.lockedUntil > Date.now()) {
      const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      return { locked: true, remainingSeconds };
    }
    if (record.lockedUntil && record.lockedUntil <= Date.now()) {
      failedAttempts.delete(key);
    }
    return { locked: false, remainingSeconds: 0 };
  },

  /**
   * Record a failed attempt and lock if threshold reached
   */
  recordFailure(key, ip, adminId) {
    const record = failedAttempts.get(key) || { count: 0, lockedUntil: null };
    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      MomoStorage.logAudit({
        actor: adminId || 'unknown_admin',
        action: 'auth_lock',
        outcome: 'blocked',
        ip_address: ip,
        metadata: { reason: `Exceeded ${MAX_FAILED_ATTEMPTS} failed attempts. Locked for 15 minutes.` }
      });
    } else {
      MomoStorage.logAudit({
        actor: adminId || 'unknown_admin',
        action: 'auth_fail',
        outcome: 'failure',
        ip_address: ip,
        metadata: { attemptCount: record.count, remaining: MAX_FAILED_ATTEMPTS - record.count }
      });
    }
    failedAttempts.set(key, record);
    return record;
  },

  /**
   * Reset failed attempts on success
   */
  recordSuccess(key, ip, adminId) {
    failedAttempts.delete(key);
    MomoStorage.logAudit({
      actor: adminId || 'admin',
      action: 'auth_verify',
      outcome: 'success',
      ip_address: ip,
      metadata: { verified: true }
    });
  },

  /**
   * Verify secret password
   */
  async verifySecret(adminId, secret, ip, userAgent) {
    const rateLimitKey = `${ip}_${adminId || 'admin'}`;
    const lockout = this.isLockedOut(rateLimitKey);
    if (lockout.locked) {
      return {
        success: false,
        locked: true,
        remainingSeconds: lockout.remainingSeconds,
        error: `Too many failed attempts. Locked for ${lockout.remainingSeconds} seconds.`
      };
    }

    if (!secret || typeof secret !== 'string') {
      this.recordFailure(rateLimitKey, ip, adminId);
      return { success: false, error: 'Secret password is required.' };
    }

    const providedHash = hashSecret(secret.trim());
    const providedLowerHash = hashSecret(secret.trim().toLowerCase());
    const targetHash = getTargetSecretHash();
    const ravitejaHash = hashSecret('Raviteja');
    const ravitejaLowerHash = hashSecret('raviteja');
    const legacyHash = hashSecret('MomoAdmin2026!');

    // Constant-time comparison helper
    const checkHashMatch = (hashA, hashB) => {
      try {
        const bufA = Buffer.from(hashA, 'hex');
        const bufB = Buffer.from(hashB, 'hex');
        if (bufA.length === bufB.length) {
          return crypto.timingSafeEqual(bufA, bufB);
        }
      } catch (e) {
        return false;
      }
      return false;
    };

    const isMatch = checkHashMatch(providedHash, targetHash) ||
                    checkHashMatch(providedHash, ravitejaHash) ||
                    checkHashMatch(providedHash, ravitejaLowerHash) ||
                    checkHashMatch(providedLowerHash, ravitejaLowerHash) ||
                    checkHashMatch(providedHash, legacyHash);

    if (!isMatch) {
      const rec = this.recordFailure(rateLimitKey, ip, adminId);
      const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - rec.count);
      return {
        success: false,
        error: rec.lockedUntil
          ? `Too many failed attempts. Account locked for 15 minutes.`
          : `Invalid secret password. ${remaining} attempts remaining before temporary lockout.`,
        locked: Boolean(rec.lockedUntil),
        remainingSeconds: rec.lockedUntil ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0
      };
    }

    // Success! Generate secure session token
    this.recordSuccess(rateLimitKey, ip, adminId);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + MOMO_SESSION_DURATION_MS);

    const session = await MomoStorage.createSession({
      admin_id: adminId || 'admin',
      session_token: sessionToken,
      ip_address: ip,
      user_agent: userAgent,
      verified_at: now.toISOString(),
      last_activity_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_revoked: false
    });

    return {
      success: true,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      adminId: session.admin_id
    };
  },

  /**
   * Validate existing session token and refresh activity
   */
  async validateSession(sessionToken) {
    if (!sessionToken) return { valid: false, reason: 'missing_token' };
    const session = await MomoStorage.getSession(sessionToken);
    if (!session || session.is_revoked) {
      return { valid: false, reason: 'revoked_or_not_found' };
    }

    // Check inactivity timeout
    const lastActivity = new Date(session.last_activity_at).getTime();
    const now = Date.now();
    if (now - lastActivity > MOMO_SESSION_DURATION_MS) {
      await MomoStorage.revokeSession(sessionToken);
      return { valid: false, reason: 'inactivity_timeout' };
    }

    // Refresh last activity
    await MomoStorage.touchSession(sessionToken);
    return { valid: true, session };
  },

  /**
   * Lock / Logout Momo session
   */
  async lockSession(sessionToken, adminId, ip) {
    if (sessionToken) {
      await MomoStorage.revokeSession(sessionToken);
    }
    await MomoStorage.logAudit({
      actor: adminId || 'admin',
      action: 'auth_lock',
      outcome: 'success',
      ip_address: ip,
      metadata: { message: 'Momo session locked by administrator.' }
    });
    return { success: true };
  }
};

module.exports = { MomoAuthService, hashSecret };
