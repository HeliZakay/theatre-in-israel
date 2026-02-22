import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Regex matching legacy numeric show URLs:
 *   /shows/42          → captures id "42", suffix undefined
 *   /shows/42/review   → captures id "42", suffix "/review"
 */
const LEGACY_SHOW_URL = /^\/shows\/(\d+)(\/review)?$/;

/**
 * Middleware handles two concerns:
 * 1. CSRF protection — validates Origin on mutating API requests.
 * 2. Legacy URL redirects — 301 from /shows/:id to /shows/:slug.
 */
export async function middleware(request: NextRequest) {
  // ── 1. Legacy show URL redirect ─────────────────────────────
  const match = request.nextUrl.pathname.match(LEGACY_SHOW_URL);
  if (match) {
    const [, numericId, suffix] = match;
    // Dynamic import to keep the module edge-compatible when Prisma
    // isn't needed (i.e. the vast majority of requests).
    const { default: prisma } = await import("@/lib/prisma");
    const show = await prisma.show.findUnique({
      where: { id: Number(numericId) },
      select: { slug: true },
    });
    if (show) {
      const destination = `/shows/${show.slug}${suffix ?? ""}`;
      return NextResponse.redirect(new URL(destination, request.url), 301);
    }
    // If the numeric ID doesn't exist, fall through — the page will 404.
  }

  // ── 2. CSRF protection on API routes ────────────────────────
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
  matcher: ["/api/:path*", "/shows/:path*"],
};
