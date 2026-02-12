import type { MetadataRoute } from "next";
import ROUTES from "@/constants/routes";
import prisma from "@/lib/prisma";
import { toAbsoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const shows = await prisma.show.findMany({
    select: { id: true },
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
  ];

  const showRoutes: MetadataRoute.Sitemap = shows.map((show) => {
    return {
      url: toAbsoluteUrl(`${ROUTES.SHOWS}/${show.id}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    };
  });

  return [...staticRoutes, ...showRoutes];
}
