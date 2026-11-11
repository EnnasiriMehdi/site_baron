import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { isPlaceholder } from "@/lib/content-guard";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    // Même garde que sitemap.ts : pas de domaine inventé dans un fichier public lu par les robots.
    ...(isPlaceholder(siteConfig.url) ? {} : { sitemap: `${siteConfig.url}/sitemap.xml` }),
  };
}
