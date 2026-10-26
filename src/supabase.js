import { createClient } from '@supabase/supabase-js';

export function normalizeSupabaseUrl(url) {
  if (!url) return '';
  let cleaned = String(url).trim();

  // Strip variable assignment prefixes if user pasted "VITE_SUPABASE_URL = ..."
  cleaned = cleaned.replace(/^VITE_SUPABASE_URL\s*=\s*/i, '');

  // Strip quotes, semicolons, brackets, and whitespace
  cleaned = cleaned.replace(/['";\s]/g, '').replace(/[<>]/g, '');

  // Check if it's an unreplaced literal placeholder
  if (cleaned.toLowerCase().includes('your-project')) {
    return '';
  }

  // If user entered only their project reference ID (e.g. 15-30 alphanumeric characters)
  if (/^[a-z0-9_-]{12,35}$/i.test(cleaned)) {
    cleaned = `https://${cleaned}.supabase.co`;
  } else if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  // Remove trailing slashes
  return cleaned.replace(/\/+$/, '');
}

export function normalizeSupabaseKey(key) {
  if (!key) return '';
  let cleaned = String(key).trim();

  // Strip variable assignment prefixes if user pasted "VITE_SUPABASE_ANON_KEY = ..."
  cleaned = cleaned.replace(/^VITE_SUPABASE_ANON_KEY\s*=\s*/i, '');

  // Strip quotes, semicolons, brackets, and whitespace
  cleaned = cleaned.replace(/['";\s]/g, '').replace(/[<>]/g, '');

  if (cleaned.toLowerCase().includes('your-anon-key')) {
    return '';
  }

  return cleaned;
}

// Get Supabase credentials from Vite environment or localStorage
export function getSupabaseCredentials() {
  const envUrl = normalizeSupabaseUrl(import.meta.env?.VITE_SUPABASE_URL);
  const envKey = normalizeSupabaseKey(import.meta.env?.VITE_SUPABASE_ANON_KEY);

  let localConfig = {};
  try {
    localConfig = JSON.parse(localStorage.getItem('maureh_supabase_config') || '{}');
  } catch {
    localConfig = {};
  }

  const localUrl = normalizeSupabaseUrl(localConfig.url);
  const localKey = normalizeSupabaseKey(localConfig.anonKey);

  const supabaseUrl = envUrl || localUrl || '';
  const supabaseKey = envKey || localKey || '';

  const isConfigured = Boolean(
    supabaseUrl && 
    supabaseKey && 
    /^https?:\/\/[a-z0-9_.-]+/i.test(supabaseUrl) &&
    supabaseKey.length > 20
  );

  return { supabaseUrl, supabaseKey, isConfigured };
}

let supabaseInstance = null;

export function getSupabase() {
  const { supabaseUrl, supabaseKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export function saveSupabaseCredentials(url, anonKey) {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = normalizeSupabaseKey(anonKey);
  localStorage.setItem('maureh_supabase_config', JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
  supabaseInstance = null; // reset client
}

