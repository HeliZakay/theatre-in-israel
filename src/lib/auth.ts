import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import ROUTES from "@/constants/routes";
import bcrypt from "bcryptjs";

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
    strategy: "jwt",
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
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
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

  if (!session?.user) {
    redirect(
      `${ROUTES.AUTH_SIGNIN}?callbackUrl=${encodeURIComponent(callbackUrl)}&reason=auth_required`,
    );
  }

  // Fetch the user from DB to ensure they exist
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect(
      `${ROUTES.AUTH_SIGNIN}?callbackUrl=${encodeURIComponent(callbackUrl)}&reason=auth_required`,
    );
  }

  return session as AuthenticatedSession;
}
