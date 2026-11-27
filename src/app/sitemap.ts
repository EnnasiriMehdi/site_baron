import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { drizzleArticleRepository } from "@/features/articles";
import { drizzleRealisationRepository } from "@/features/realisations";
import { isPlaceholder } from "@/lib/content-guard";

// Tant que le domaine réel (siteConfig.url) n'est pas connu, aucune URL absolue fiable ne peut
// être générée : un sitemap avec un domaine TODO(contenu) serait pire qu'aucun sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isPlaceholder(siteConfig.url)) return [];

  const [articles, realisationsCount] = await Promise.all([
    drizzleArticleRepository.listPublished(1000, 0),
    drizzleRealisationRepository.countAll(),
  ]);

  return [
    { url: siteConfig.url, lastModified: new Date() },
    { url: `${siteConfig.url}/blog` },
    ...articles.map((article) => ({
      url: `${siteConfig.url}/blog/${article.slug}`,
      lastModified: article.updatedAt,
    })),
    ...(realisationsCount > 0 ? [{ url: `${siteConfig.url}/realisations` }] : []),
    { url: `${siteConfig.url}/mentions-legales` },
    { url: `${siteConfig.url}/politique-de-confidentialite` },
  ];
}
