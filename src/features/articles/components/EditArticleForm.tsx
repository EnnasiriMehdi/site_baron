"use client";

import { useActionState, useEffect } from "react";

import { siteConfig } from "@/config/site";
import { FileInput, Field, Form, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast/toast";
import type { Article } from "@/lib/db/schema";
import { PUBLIC_IMAGE_MAX_SIDE } from "@/lib/image-compression";

import { updateArticleAction, type ArticleFormState } from "../actions";
import { ArticleEditor } from "./ArticleEditor";

const initialState: ArticleFormState = null;

type EditArticleFormProps = {
  article: Article;
};

export function EditArticleForm({ article }: EditArticleFormProps) {
  const [state, action] = useActionState(updateArticleAction, initialState);
  const toast = useToast();

  // Avant, un enregistrement réussi ne donnait aucun retour visuel.
  useEffect(() => {
    if (!state) return;
    if ("error" in state) toast.error(state.error);
    else toast.success("Article enregistré.");
  }, [state, toast]);
  const slugLocked = article.status === "published";

  return (
    <Form
      action={action}
      className="max-w-2xl"
      actions={
        <SubmitButton pendingLabel="Enregistrement…" className="self-start">
          Enregistrer
        </SubmitButton>
      }
    >
      <input type="hidden" name="id" value={article.id} />

      <Field name="title" label="Titre (60 caractères max)">
        <Input type="text" required maxLength={60} defaultValue={article.title} />
      </Field>

      <Field name="slug" label={slugLocked ? "Slug (figé : l'article est déjà publié)" : "Slug"}>
        <Input
          type="text"
          required
          disabled={slugLocked}
          pattern="[a-z0-9-]+"
          defaultValue={article.slug}
          className="disabled:opacity-60"
        />
      </Field>

      <Field name="description" label="Description (155 caractères max)">
        <Textarea required maxLength={155} rows={2} defaultValue={article.description} />
      </Field>

      <Field name="authorName" label="Auteur">
        <Input type="text" required defaultValue={article.authorName} />
      </Field>

      <Field name="relatedServiceSlug" label="Service lié (facultatif)">
        <Select defaultValue={article.relatedServiceSlug ?? ""}>
          <option value="">Aucun</option>
          {siteConfig.services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        name="coverImage"
        label={`Photo de couverture (JPG, PNG ou WEBP, 5 Mo maximum)${
          article.coverImagePath ? " — remplace la photo actuelle si vous en choisissez une nouvelle" : ""
        }`}
      >
        <FileInput accept="image/jpeg,image/png,image/webp" optimizeImages={PUBLIC_IMAGE_MAX_SIDE} />
      </Field>

      <Field
        name="coverImageAlt"
        label={`Texte alternatif de la couverture${article.coverImagePath ? "" : " (obligatoire avant publication)"}`}
      >
        <Input type="text" maxLength={160} defaultValue={article.coverImageAlt ?? ""} />
      </Field>

      {/* L'éditeur gère lui-même son champ caché « body » : le Field ne fournit ici que le label. */}
      <Field name="body" label="Contenu">
        <div className="mt-1">
          <ArticleEditor name="body" defaultValue={article.body} />
        </div>
      </Field>
    </Form>
  );
}
