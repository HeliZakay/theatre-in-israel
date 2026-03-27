import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

/**
 * Proxy handles:
 * 1. CSRF protection on mutating API requests
 * 2. Auth protection on /me routes
 *
 * Legacy numeric URL redirects (/shows/:id → /shows/:slug) are handled
 * in the [slug] page component to avoid bundling Prisma into the Edge
 * Function (which would exceed the 1 MB size limit).
 */
export async function proxy(request: NextRequest) {
  // ── CSRF protection on API routes ───────────────────────────
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    MUTATING_METHODS.has(request.method)
  ) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    if (!origin && !referer) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const sourceUrl = origin ?? referer!;
    let sourceHost: string;
    try {
      sourceHost = new URL(sourceUrl).host;
    } catch {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (sourceHost !== host) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.next();
  }

  // ── Auth protection on /me routes ───────────────────────────
  const { pathname } = request.nextUrl;
  if (pathname === "/me" || pathname.startsWith("/me/")) {
    const token = await getToken({ req: request, secret });

    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      signInUrl.searchParams.set("reason", "auth_required");
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/me", "/me/:path*"],
};
