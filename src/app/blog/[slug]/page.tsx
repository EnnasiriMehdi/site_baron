import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { drizzleArticleRepository } from "@/features/articles";
import { serializeJsonLd } from "@/lib/json-ld";
import { renderArticleBody } from "@/lib/markdown";
import { BannerPlaceholder } from "@/components/ui/BannerPlaceholder";

export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await drizzleArticleRepository.listPublished(1000, 0);
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await drizzleArticleRepository.findBySlugPublished(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      ...(article.coverImagePath ? { images: [article.coverImagePath] } : {}),
    },
  };
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await drizzleArticleRepository.findBySlugPublished(slug);
  if (!article) notFound();

  const relatedService = siteConfig.services.find((service) => service.slug === article.relatedServiceSlug);
  const bodyHtml = renderArticleBody(article.body);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { "@type": "Person", name: article.authorName },
    publisher: { "@type": "Organization", name: siteConfig.name },
    ...(article.coverImagePath ? { image: article.coverImagePath } : {}),
  };

  return (
    <main id="contenu" className="mx-auto max-w-3xl px-4 py-14 sm:py-16">
      {/* Données de confiance (base, admin uniquement) : jamais d'entrée utilisateur non échappée. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-(--radius-lg)">
        {article.coverImagePath ? (
          <Image src={article.coverImagePath} alt={article.coverImageAlt ?? ""} fill sizes="100vw" className="object-cover" priority />
        ) : (
          <BannerPlaceholder />
        )}
      </div>

      <h1 className="mt-6 text-3xl font-extrabold">{article.title}</h1>
      <p className="mt-2 text-sm text-(--color-text-muted)">
        {article.authorName} · {article.publishedAt && dateFormatter.format(article.publishedAt)}
      </p>

      {/*
       * bodyHtml vient de lib/markdown.ts (markdown-it, html:false) : tout HTML brut présent dans
       * la source est échappé en texte, jamais interprété — pas de risque XSS malgré dangerouslySetInnerHTML
       * (CLAUDE.md, 7ter.2 et 8.2).
       */}
      <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      {relatedService && (
        <p className="mt-10 text-base">
          En savoir plus sur notre service{" "}
          <Link href={`/#services`} className="font-semibold text-(--color-primary) underline">
            {relatedService.title.toLowerCase()}
          </Link>
          .
        </p>
      )}

      <div className="mt-10 rounded-(--radius-lg) bg-(--color-primary) p-6 text-center text-(--color-primary-contrast)">
        <p className="font-semibold">Besoin d&apos;une intervention ?</p>
        <a
          href={siteConfig.phone.href}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-(--radius-md) bg-(--color-surface) px-6 py-3 font-semibold text-(--color-text)"
        >
          Demander une intervention
        </a>
      </div>
    </main>
  );
}
