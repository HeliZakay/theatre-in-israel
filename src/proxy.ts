import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Proxy handles CSRF protection on mutating API requests.
 *
 * Legacy numeric URL redirects (/shows/:id → /shows/:slug) are handled
 * in the [slug] page component to avoid bundling Prisma into the Edge
 * Function (which would exceed the 1 MB size limit).
 */
export function proxy(request: NextRequest) {
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
