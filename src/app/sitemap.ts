import type { MetadataRoute } from "next";
import ROUTES, { showPath, eventsPath, theatrePath, genrePath } from "@/constants/routes";
import { REGION_SLUGS, CITY_SLUGS } from "@/lib/eventsConstants";
import { THEATRES } from "@/constants/theatres";
import { GENRES } from "@/constants/genres";
import prisma from "@/lib/prisma";
import { toAbsoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const shows = await prisma.show.findMany({
    select: {
      slug: true,
      reviews: {
        select: { date: true },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
    orderBy: { id: "asc" },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl(ROUTES.HOME),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: toAbsoluteUrl(ROUTES.SHOWS),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl(ROUTES.CONTACT),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Events routes — indexed combos
  const indexedDateSlugs = ["weekend", "week", "nextweek"];
  const regionSlugs = Object.keys(REGION_SLUGS);
  const citySlugs = Object.keys(CITY_SLUGS);

  const eventsRoutes: MetadataRoute.Sitemap = [
    // /events (default)
    {
      url: toAbsoluteUrl(ROUTES.EVENTS),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    // Each region
    ...regionSlugs.map((slug) => ({
      url: toAbsoluteUrl(eventsPath([slug])),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    // Indexed date presets
    ...indexedDateSlugs.map((slug) => ({
      url: toAbsoluteUrl(eventsPath([slug])),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    // Cities
    ...citySlugs.map((slug) => ({
      url: toAbsoluteUrl(eventsPath([slug])),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    // Indexed date+region combos
    ...indexedDateSlugs.flatMap((date) =>
      regionSlugs.map((region) => ({
        url: toAbsoluteUrl(eventsPath([date, region])),
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ),
  ];

  const showRoutes: MetadataRoute.Sitemap = shows.map((show) => {
    const latestReview = show.reviews[0];
    return {
      url: toAbsoluteUrl(showPath(show.slug)).replace(/&/g, "&amp;"),
      lastModified: latestReview ? latestReview.date : now,
      changeFrequency: "daily",
      priority: 0.8,
    };
  });

  const theatreRoutes: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl(ROUTES.THEATRES),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    ...THEATRES.map((t) => ({
      url: toAbsoluteUrl(theatrePath(t.slug)),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
  ];

  const genreRoutes: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl(ROUTES.GENRES),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    ...GENRES.map((g) => ({
      url: toAbsoluteUrl(genrePath(g.slug)),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
  ];

  return [...staticRoutes, ...theatreRoutes, ...genreRoutes, ...eventsRoutes, ...showRoutes];
}
