/**
 * AppConstants.tsx
 * -----------------
 * ⚠️ SECURITY: API keys must NEVER be hardcoded here.
 * Use VITE_ prefixed environment variables in your .env file (never commit .env).
 * In Vercel: set them under Project → Settings → Environment Variables.
 */
export const AppConstants = {
  // Reads from VITE_GOOGLE_DRIVE_API_KEY in .env / Vercel env vars
  DRIVE_API_KEY: import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || ''
};
