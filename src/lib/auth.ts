import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import ROUTES from "@/constants/routes";

/** A session that is guaranteed to have a user with an id. */
export interface AuthenticatedSession extends Session {
  user: NonNullable<Session["user"]> & { id: string };
}

/**
 * Read an env var, warn (not throw) to avoid breaking the build.
 * The Google provider will fail at runtime if these are missing.
 */
function envOrWarn(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(
      `[auth] Missing environment variable: ${name}. ` +
        `Set it in your .env file or hosting environment.`,
    );
  }
  return value ?? "";
}

const googleClientId = envOrWarn("AUTH_GOOGLE_ID");
const googleClientSecret = envOrWarn("AUTH_GOOGLE_SECRET");

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  if (
    process.env.NODE_ENV === "production" &&
    !secret &&
    typeof window === "undefined" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error(
      "[auth] AUTH_SECRET or NEXTAUTH_SECRET must be set in production. " +
        "Generate one with `openssl rand -base64 32`.",
    );
  }
  return secret;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: getAuthSecret(),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: ROUTES.AUTH_SIGNIN,
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    session: ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

/**
 * Require an authenticated session on a server page.
 * Redirects to sign-in with a callback URL if not authenticated.
 */
export async function requireAuth(
  callbackUrl: string,
): Promise<AuthenticatedSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(
      `${ROUTES.AUTH_SIGNIN}?callbackUrl=${encodeURIComponent(callbackUrl)}&reason=auth_required`,
    );
  }

  return session as AuthenticatedSession;
}
