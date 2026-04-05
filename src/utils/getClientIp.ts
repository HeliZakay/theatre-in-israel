/**
 * Extract the client IP address from request headers.
 * Uses the first entry in x-forwarded-for (set by reverse proxies like Vercel).
 */
export function getClientIp(headersList: Headers): string {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}
