import type { Show } from "@/types";
import { getShowImagePath } from "@/utils/getShowImagePath";

const DEFAULT_LOCAL_URL = "http://localhost:3000";

export const SITE_NAME = "תיאטרון בישראל";
export const SITE_DESCRIPTION =
  "ביקורות, דירוגים והמלצות קהל להצגות תיאטרון בישראל.";

export interface ShowStats {
  reviewCount: number;
  avgRating: number | null;
  latestReviewDate: Date | null;
}

function normalizeSiteUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_LOCAL_URL;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.endsWith("/") ? withProtocol.slice(0, -1) : withProtocol;
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

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildCreativeWorkJsonLd(
  show: Show,
  stats: ShowStats,
  canonicalPath: string,
) {
  const { avgRating, reviewCount } = stats;

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: show.title,
    description: show.summary,
    inLanguage: "he-IL",
    image: toAbsoluteUrl(getShowImagePath(show.title)),
    genre: show.genre,
    mainEntityOfPage: toAbsoluteUrl(canonicalPath),
    aggregateRating:
      avgRating !== null
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review: show.reviews.slice(0, 5).map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author,
      },
      name: review.title ?? `ביקורת על ${show.title}`,
      reviewBody: review.text,
      datePublished: new Date(review.date).toISOString(),
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };
}
