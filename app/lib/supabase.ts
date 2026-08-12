import { createClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://fnrurqgyrkdvrfgepfws.supabase.co";
const defaultSupabasePublishableKey = "sb_publishable_MWKHaiTKqYrL__fSFLMHig_pX59l4l0";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || defaultSupabasePublishableKey;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    // The callback page exchanges PKCE codes explicitly. Automatic URL
    // detection would consume the same one-time code a second time.
    detectSessionInUrl: false,
  },
});
