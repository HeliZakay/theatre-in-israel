import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const nextAuth = NextAuth(authOptions);

// Next.js 15+ passes params as a Promise; NextAuth v4 expects them synchronous.
// This wrapper awaits the params and injects them so NextAuth can read `params.nextauth`.
async function handler(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  const params = await context.params;
  return nextAuth(req, { params });
}

export { handler as GET, handler as POST };
