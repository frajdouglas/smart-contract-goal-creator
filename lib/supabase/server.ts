import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
// console.log( supabaseServiceRoleKeyenv, "supabaseServiceRoleKeyenv");    
const supabaseServiceRoleKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5c3JxdmJubGttcXlvaGJueWlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc4MzcyNSwiZXhwIjoyMDYyMzU5NzI1fQ.yr82rJUfn5meDOaleUx2clDqJv8TOEOUkmCVrEjINLI'
if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined in the environment variables.");
}

// Create a Supabase client for server-side use
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);
