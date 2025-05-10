import { createClient } from "@supabase/supabase-js"

// For Pages Router, we need a different approach for server-side Supabase client
export function createServerClient() {
  return createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string)
}
