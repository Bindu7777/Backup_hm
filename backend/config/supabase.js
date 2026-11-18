const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - using environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const log = require('../utils/logger')('supabase');

const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Missing settings are logged clearly instead of crashing the whole backend, so
// /api/health still answers and every request that needs the database says why it failed.
if (!supabaseConfigured) {
  log.error('config', 'Missing Supabase environment variables: set SUPABASE_URL and SUPABASE_ANON_KEY (or the VITE_ names) in this Vercel project', {
    url: supabaseUrl ? 'set' : 'missing',
    key: supabaseKey ? 'set' : 'missing',
  });
} else {
  log.info('config', 'Supabase client configured');
}

// Create Supabase client (a stand-in that throws a clear error when settings are missing)
const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : new Proxy({}, {
      get() {
        throw new Error('Supabase is not configured: SUPABASE_URL / SUPABASE_ANON_KEY are missing');
      },
    });

module.exports = { supabase, supabaseConfigured };
