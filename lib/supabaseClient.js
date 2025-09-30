import { createClient } from "@supabase/supabase-js";

let supabase = null;

export function getSupabase() {
  if (!supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      console.error(
        "Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
    }
    supabase = createClient(url || "", anonKey || "", {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return supabase;
}

// Important: For emailRedirectTo to work in production, you must add your site's
// URL to the "Redirect URLs" allow-list in your Supabase project's auth settings.
export async function sendEmailOtp(email, redirectTo = null) {
  const client = getSupabase();
  const options = {
    shouldCreateUser: true,
  };

  if (redirectTo) {
    options.emailRedirectTo = redirectTo;
  }

  const { data, error } = await client.auth.signInWithOtp({
    email,
    options,
  });
  if (error) throw error;
  return data;
}

export async function verifyEmailOtp(email, token) {
  const client = getSupabase();
  // Use 'magiclink' for OTPs sent via signInWithOtp, as per Supabase convention.
  // The 'email' type is for confirming email changes or initial sign-ups.
  const { data, error } = await client.auth.verifyOtp({
    email,
    token,
    type: "magiclink",
  });
  if (error) throw error;
  return data;
}
