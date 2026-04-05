import { cookies } from "next/headers";
import crypto from "crypto";

const ANON_TOKEN_COOKIE = "anon_reviewer";
const ONE_YEAR = 365 * 24 * 60 * 60;

/**
 * Read the anonymous reviewer token from the cookie.
 * Safe to call from server components (read-only).
 */
export async function getAnonToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ANON_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Read the anonymous reviewer token, or create one and set the cookie.
 * Must be called from a server action or route handler (sets a cookie).
 */
export async function getOrCreateAnonToken(): Promise<string> {
  const existing = await getAnonToken();
  if (existing) return existing;

  const token = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(ANON_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return token;
}
