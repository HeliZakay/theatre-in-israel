import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { proxy } from "@/proxy";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function middleware(request: NextRequest) {
  // CSRF protection on API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return proxy(request);
  }

  // Auth protection on /me routes
  const token = await getToken({ req: request, secret });

  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    signInUrl.searchParams.set("reason", "auth_required");
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/me/:path*"],
};
