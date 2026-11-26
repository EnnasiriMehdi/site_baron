import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { siteConfig } from "@/config/site";
import type { Article } from "@/lib/db/schema";

import { blogPageHref } from "../pagination";

export const BLOG_DESCRIPTION = `Conseils et actualités ${siteConfig.name} : chauffage, climatisation et plomberie.`;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

type BlogArticleListProps = {
  articles: Article[];
  page: number;
  totalPages: number;
};

// Liste paginée du blog, partagée par /blog (page 1) et /blog/page/N.
export function BlogArticleList({ articles, page, totalPages }: BlogArticleListProps) {
  return (
    <main id="contenu" className="mx-auto max-w-5xl px-4 py-14 sm:py-16">
      <h1 className="text-3xl font-extrabold">Blog</h1>
      <p className="mt-2 max-w-2xl text-(--color-text-muted)">
        Conseils pratiques et actualités chauffage, climatisation et plomberie.
      </p>

      {articles.length === 0 ? (
        <p className="mt-8 text-(--color-text-muted)">Aucun article publié pour le moment.</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id} className="overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)">
              <Link href={`/blog/${article.slug}`}>
                <div className="relative aspect-[16/9] w-full bg-(--color-surface-muted)">
                  {article.coverImagePath ? (
                    <Image
                      src={article.coverImagePath}
                      alt={article.coverImageAlt ?? ""}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder className="absolute inset-0" />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-(--color-text-muted)">
                    {article.publishedAt && dateFormatter.format(article.publishedAt)}
                  </p>
                  <h2 className="mt-1 font-semibold">{article.title}</h2>
                  <p className="mt-1 text-sm text-(--color-text-muted)">{article.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination du blog" className="mt-10 flex items-center justify-center gap-4">
          {page > 1 && (
            <Link href={blogPageHref(page - 1)} rel="prev" className="text-sm font-semibold text-(--color-primary) underline">
              Articles plus récents
            </Link>
          )}
          <span className="text-sm text-(--color-text-muted)">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={blogPageHref(page + 1)} rel="next" className="text-sm font-semibold text-(--color-primary) underline">
              Articles plus anciens
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
