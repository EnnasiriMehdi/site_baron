import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/features/admin-auth";
import {
  deleteArticleAction,
  drizzleArticleRepository,
  isReadyToPublish,
  publishArticleAction,
  unpublishArticleAction,
} from "@/features/articles";
import { EditArticleForm } from "@/features/articles/components/EditArticleForm";

export const metadata: Metadata = {
  title: "Modifier l'article",
  robots: { index: false, follow: false },
};

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const article = await drizzleArticleRepository.findById(id);
  if (!article) notFound();

  const readyToPublish = isReadyToPublish(article);

  return (
    <section aria-labelledby="edit-article-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="edit-article-title" className="text-2xl font-bold">
          Modifier l&apos;article
        </h1>

        <div className="flex flex-wrap gap-2">
          {article.status === "published" ? (
            <>
              <Link href={`/blog/${article.slug}`} target="_blank" className="min-h-11 content-center text-sm underline">
                Voir l&apos;article publié
              </Link>
              <form
                action={async () => {
                  "use server";
                  await unpublishArticleAction(id);
                }}
              >
                <button
                  type="submit"
                  className="min-h-11 rounded-(--radius-md) border border-(--color-border) px-4 py-2 text-sm font-medium"
                >
                  Dépublier
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await publishArticleAction(id);
              }}
            >
              <button
                type="submit"
                disabled={!readyToPublish}
                title={readyToPublish ? undefined : "Ajoutez une photo de couverture et son texte alternatif avant de publier"}
                className="min-h-11 rounded-(--radius-md) bg-(--color-primary) px-4 py-2 text-sm font-semibold text-(--color-primary-contrast) disabled:opacity-50"
              >
                Publier
              </button>
            </form>
          )}
          <form
            action={async () => {
              "use server";
              await deleteArticleAction(id);
            }}
          >
            <button type="submit" className="min-h-11 rounded-(--radius-md) border border-(--color-danger) px-4 py-2 text-sm font-medium text-(--color-danger)">
              Supprimer
            </button>
          </form>
        </div>
      </div>

      {!readyToPublish && article.status === "draft" && (
        <p className="mt-3 text-sm text-(--color-text-muted)">
          Enregistrez une photo de couverture avec son texte alternatif pour pouvoir publier.
        </p>
      )}

      <div className="mt-6">
        <EditArticleForm article={article} />
      </div>
    </section>
  );
}
