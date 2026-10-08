import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from Vite environment or localStorage
export function getSupabaseCredentials() {
  const envUrl = import.meta.env?.VITE_SUPABASE_URL;
  const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

  const localConfig = JSON.parse(localStorage.getItem('maureh_supabase_config') || '{}');

  const supabaseUrl = envUrl || localConfig.url || '';
  const supabaseKey = envKey || localConfig.anonKey || '';

  return { supabaseUrl, supabaseKey, isConfigured: Boolean(supabaseUrl && supabaseKey) };
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
  localStorage.setItem('maureh_supabase_config', JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
  supabaseInstance = null; // reset client
}
