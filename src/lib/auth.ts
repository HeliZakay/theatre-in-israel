import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import ROUTES from "@/constants/routes";

const googleClientId = process.env.AUTH_GOOGLE_ID ?? "";
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? "";
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  session: {
    strategy: "database",
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
