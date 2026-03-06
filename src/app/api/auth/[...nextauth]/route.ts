import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const nextAuth = NextAuth(authOptions);

async function handler(req: NextRequest) {
  try {
    return await nextAuth(req);
  } catch (error) {
    console.error("[nextauth] Unhandled error:", error);
    const errorUrl = new URL("/auth/error?error=Default", req.url);
    return Response.redirect(errorUrl);
  }
}

export { handler as GET, handler as POST };
