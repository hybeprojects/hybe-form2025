import { createClient } from '@supabase/supabase-js';

let supabase = null;

export function getSupabase() {
  if (!supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      console.error('Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    supabase = createClient(url || '', anonKey || '', {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
  return supabase;
}

export async function sendEmailOtp(email) {
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
  return data;
}

export async function verifyEmailOtp(email, token) {
  const client = getSupabase();
  const { data, error } = await client.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data;
}
