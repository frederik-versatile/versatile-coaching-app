import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // IMPORTANT: avoid writing logic between createServerClient and getUser().
  // Refreshing the session token needs to happen before anything else reads it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isCoachRoute = pathname.startsWith("/coach");
  const isClientRoute = pathname.startsWith("/client");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  if ((isCoachRoute || isClientRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (isCoachRoute || isClientRoute || isAuthRoute)) {
    // Role check queried with the user's own session, so RLS ("users read own
    // profile") is what actually enforces this — the app code is just routing.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (isCoachRoute && role !== "coach") {
      const url = request.nextUrl.clone();
      url.pathname = role === "client" ? "/client/dashboard" : "/login";
      return NextResponse.redirect(url);
    }

    if (isClientRoute && role !== "client") {
      const url = request.nextUrl.clone();
      url.pathname = role === "coach" ? "/coach/dashboard" : "/login";
      return NextResponse.redirect(url);
    }

    if (isAuthRoute && role) {
      const url = request.nextUrl.clone();
      url.pathname = role === "coach" ? "/coach/dashboard" : "/client/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
