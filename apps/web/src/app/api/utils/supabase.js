import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS, used server-side only
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
