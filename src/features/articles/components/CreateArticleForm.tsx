"use client";

import { useActionState } from "react";

import { siteConfig } from "@/config/site";

import { createArticleAction, type ArticleFormState } from "../actions";
import { ArticleEditor } from "./ArticleEditor";

const initialState: ArticleFormState = null;

export function CreateArticleForm() {
  const [state, action, pending] = useActionState(createArticleAction, initialState);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
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
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Slug (facultatif — généré automatiquement depuis le titre si vide)
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          pattern="[a-z0-9-]+"
          placeholder="fuite-eau-que-faire"
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description (155 caractères max, utilisée pour le référencement)
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={155}
          rows={2}
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
          defaultValue={siteConfig.contactName}
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
          defaultValue=""
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
        <label htmlFor="body" className="block text-sm font-medium">
          Contenu
        </label>
        <div className="mt-1">
          <ArticleEditor name="body" defaultValue="" />
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
        {pending ? "Création…" : "Créer le brouillon"}
      </button>
    </form>
  );
}
