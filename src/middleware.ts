import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Lightweight middleware that validates the Origin header on
 * mutating requests. Closes the SameSite=Lax loophole for
 * top-level cross-origin form submissions.
 */
export function middleware(request: NextRequest) {
  if (MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // Require at least Origin or Referer on mutating requests
    if (!origin && !referer) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Determine the source host from Origin (preferred) or Referer
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
