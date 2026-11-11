import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/features/admin-auth";
import { drizzleArticleRepository } from "@/features/articles";

export const metadata: Metadata = {
  title: "Articles",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminArticlesPage() {
  await requireAdmin();
  const articles = await drizzleArticleRepository.list();

  return (
    <section aria-labelledby="articles-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="articles-title" className="text-2xl font-bold">
          Articles
        </h1>
        <Link
          href="/admin/articles/new"
          className="min-h-11 rounded-(--radius-md) bg-(--color-primary) px-4 py-2 font-semibold text-(--color-primary-contrast)"
        >
          Nouvel article
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="mt-4 text-(--color-text-muted)">Aucun article pour le moment.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/admin/articles/${article.id}/edit`}
                className="flex flex-col gap-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 hover:border-(--color-primary) sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {article.title}
                    <span
                      className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        article.status === "published"
                          ? "bg-(--color-primary-soft) text-(--color-primary)"
                          : "bg-(--color-surface-muted) text-(--color-text-muted)"
                      }`}
                    >
                      {article.status === "published" ? "Publié" : "Brouillon"}
                    </span>
                  </p>
                  <p className="text-sm text-(--color-text-muted)">/blog/{article.slug}</p>
                </div>
                <p className="text-sm text-(--color-text-muted)">{dateFormatter.format(article.updatedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
