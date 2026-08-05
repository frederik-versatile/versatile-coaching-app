import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // @supabase/ssr defaults to PKCE, which requires the code_verifier
      // it stashes in a cookie on whichever browser made the original
      // request. Invite/recovery links are always opened by the recipient
      // on a different device than the one that triggered the email, so
      // that verifier can never be there -- explicit implicit flow embeds
      // real tokens directly in the link instead, which any browser can
      // redeem with no prior state.
      auth: {
        flowType: "implicit",
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignore: called from a Server Component render.
            // Session refresh is handled by middleware instead.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Ignore: called from a Server Component render.
          }
        },
      },
    }
  );
}
