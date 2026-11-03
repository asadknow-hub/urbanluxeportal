import { type NextRequest, NextResponse } from "next/server";

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
  "/company-properties",
  "/login",
];

function isFrontendOnly() {
  const raw =
    process.env.NEXT_PUBLIC_FRONTEND_ONLY ?? process.env.FRONTEND_ONLY ?? "1";
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function isPortalPath(pathname: string) {
  return PORTAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(
    ({ name }) => name.startsWith("sb-") && name.includes("auth-token")
  );
}

/** Marketing + auth pages — never call Supabase here (Vercel proxy timeout). */
function isPublicWebPath(pathname: string) {
  if (pathname === "/login") return true;
  return !isPortalPath(pathname);
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

  // Public-site phase: CRM / portal routes stay offline.
  if (isFrontendOnly() && isPortalPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isPublicWebPath(pathname)) {
    return NextResponse.next();
  }

  // CRM routes without a session cookie → login immediately (no Supabase round trip).
  if (!hasSupabaseSessionCookie(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Session cookie present: let (app)/layout enforce auth via user JWT + RLS.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
