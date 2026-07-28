import { createClient } from "@supabase/supabase-js";

// Service-role client: full Auth Admin API + full DB access, no RLS at all.
//
// This file must never be imported by a Client Component, a route that ships
// to the browser, or anything reachable without going through a server-side
// authorization check first. The only legitimate use in this app is the
// invite-client Server Action, which verifies the caller is an actual coach
// (via the normal user-session client, respecting RLS) before ever touching
// this client — RLS provides no safety net here, since the service role
// bypasses it entirely.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
