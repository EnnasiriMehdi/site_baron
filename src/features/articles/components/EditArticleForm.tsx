"use client";

import { useActionState } from "react";

import { siteConfig } from "@/config/site";
import type { Article } from "@/lib/db/schema";

import { updateArticleAction, type ArticleFormState } from "../actions";
import { ArticleEditor } from "./ArticleEditor";

const initialState: ArticleFormState = null;

type EditArticleFormProps = {
  article: Article;
};

export function EditArticleForm({ article }: EditArticleFormProps) {
  const [state, action, pending] = useActionState(updateArticleAction, initialState);
  const slugLocked = article.status === "published";

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="id" value={article.id} />

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Titre (60 caractères max)
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={60}
          defaultValue={article.title}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Slug {slugLocked && "(figé : l'article est déjà publié)"}
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          disabled={slugLocked}
          pattern="[a-z0-9-]+"
          defaultValue={article.slug}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2 disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description (155 caractères max)
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={155}
          rows={2}
          defaultValue={article.description}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="authorName" className="block text-sm font-medium">
          Auteur
        </label>
        <input
          id="authorName"
          name="authorName"
          type="text"
          required
          defaultValue={article.authorName}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="relatedServiceSlug" className="block text-sm font-medium">
          Service lié (facultatif)
        </label>
        <select
          id="relatedServiceSlug"
          name="relatedServiceSlug"
          defaultValue={article.relatedServiceSlug ?? ""}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        >
          <option value="">Aucun</option>
          {siteConfig.services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="coverImage" className="block text-sm font-medium">
          Photo de couverture (JPG, PNG ou WEBP, 5 Mo maximum)
          {article.coverImagePath && " — remplace la photo actuelle si vous en choisissez une nouvelle"}
        </label>
        <input id="coverImage" name="coverImage" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 w-full text-sm" />
      </div>

      <div>
        <label htmlFor="coverImageAlt" className="block text-sm font-medium">
          Texte alternatif de la couverture {!article.coverImagePath && "(obligatoire avant publication)"}
        </label>
        <input
          id="coverImageAlt"
          name="coverImageAlt"
          type="text"
          maxLength={160}
          defaultValue={article.coverImageAlt ?? ""}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium">
          Contenu
        </label>
        <div className="mt-1">
          <ArticleEditor name="body" defaultValue={article.body} />
        </div>
      </div>

      <div role="alert" aria-live="assertive" className="min-h-6">
        {state && "error" in state && <p className="text-sm text-(--color-danger)">{state.error}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 self-start rounded-(--radius-md) bg-(--color-primary) px-5 py-3 font-semibold text-(--color-primary-contrast) disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
