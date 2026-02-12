const DEFAULT_LOCAL_URL = "http://localhost:3000";

export const SITE_NAME = "תיאטרון בישראל";
export const SITE_DESCRIPTION =
  "ביקורות, דירוגים והמלצות קהל להצגות תיאטרון בישראל.";

function normalizeSiteUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_LOCAL_URL;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.endsWith("/")
    ? withProtocol.slice(0, -1)
    : withProtocol;
}

export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    DEFAULT_LOCAL_URL;

  return normalizeSiteUrl(configured);
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl());
}

export function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function toJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
