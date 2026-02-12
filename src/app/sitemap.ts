import type { MetadataRoute } from "next";
import ROUTES from "@/constants/routes";
import { getShows } from "@/lib/shows";
import { toAbsoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const shows = await getShows();

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
  ];

  const showRoutes: MetadataRoute.Sitemap = shows.map((show) => {
    const latestReviewDate = show.reviews?.[0]?.date;

    return {
      url: toAbsoluteUrl(`${ROUTES.SHOWS}/${show.id}`),
      lastModified: latestReviewDate ? new Date(latestReviewDate) : now,
      changeFrequency: "daily",
      priority: 0.8,
    };
  });

  return [...staticRoutes, ...showRoutes];
}
