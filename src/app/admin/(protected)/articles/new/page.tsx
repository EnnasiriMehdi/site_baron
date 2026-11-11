import type { Metadata } from "next";

import { requireAdmin } from "@/features/admin-auth";
import { CreateArticleForm } from "@/features/articles/components/CreateArticleForm";

export const metadata: Metadata = {
  title: "Nouvel article",
  robots: { index: false, follow: false },
};

export default async function NewArticlePage() {
  await requireAdmin();

  return (
    <section aria-labelledby="new-article-title">
      <h1 id="new-article-title" className="text-2xl font-bold">
        Nouvel article
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-(--color-text-muted)">
        Le brouillon est créé d&apos;abord ; la photo de couverture et la publication se font à
        l&apos;étape suivante.
      </p>
      <div className="mt-6">
        <CreateArticleForm />
      </div>
    </section>
  );
}
