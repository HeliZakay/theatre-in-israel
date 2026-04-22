import type { MetadataRoute } from "next";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/me/", "/reviews/new", "/reviews/batch", "/shows/*/review"],
    },
    sitemap: toAbsoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
