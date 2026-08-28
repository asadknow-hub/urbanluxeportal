import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login"];

const PORTAL_PREFIXES = [
  "/dashboard",
  "/leads",
  "/pipeline",
  "/customers",
  "/team",
  "/settings",
  "/deals",
  "/viewings",
  "/inventory",
];

function isPortalPath(pathname: string) {
  return PORTAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(
    ({ name }) => name.startsWith("sb-") && name.includes("auth-token")
  );
}

/** Marketing site routes — no session work in proxy (avoids Supabase latency/timeouts on `/`). */
function isPublicWebPath(pathname: string) {
  return !isPortalPath(pathname) && !PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Public brochure pages: skip auth entirely. Portal layout still enforces login.
  if (isPublicWebPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = hasSupabaseSessionCookie(request);

  // Logged-out portal visits: redirect immediately — no Supabase round trip.
  if (!hasSession && isPortalPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Logged-out login page: serve immediately.
  if (!hasSession && pathname === "/login") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isPortalPath(pathname) && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .single();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", "account_deactivated");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
