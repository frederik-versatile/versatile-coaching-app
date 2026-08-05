import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Matches lib/supabase/server.ts -- see that file for why implicit
      // flow (not @supabase/ssr's PKCE default) is required for links
      // that get opened on a different device than the one that sent them.
      auth: {
        flowType: "implicit",
      },
    }
  );
}
