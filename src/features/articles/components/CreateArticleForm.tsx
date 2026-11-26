"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { siteConfig } from "@/config/site";
import { Field, Form, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast/toast";

import { createArticleAction, type ArticleFormState } from "../actions";
import { ArticleEditor } from "./ArticleEditor";

const initialState: ArticleFormState = null;

export function CreateArticleForm() {
  const [state, action] = useActionState(createArticleAction, initialState);
  const toast = useToast();
  const router = useRouter();

  // Le toast reste affiché après la navigation : le fournisseur est dans app/admin/layout.tsx, qui ne se remonte pas.
  // Les erreurs passent par un toast (pas de zone d'erreur dans le formulaire).
  useEffect(() => {
    if (!state) return;
    if ("error" in state) {
      toast.error(state.error);
      return;
    }
    toast.success("Article créé. Vous pouvez maintenant le compléter.");
    router.push(`/admin/articles/${state.id}/edit`);
  }, [state, toast, router]);

  return (
    <Form
      action={action}
      className="max-w-2xl"
      actions={
        <SubmitButton pendingLabel="Création…" className="self-start">
          Créer le brouillon
        </SubmitButton>
      }
    >
      <Field name="title" label="Titre (60 caractères max)">
        <Input type="text" required maxLength={60} />
      </Field>

      <Field name="slug" label="Slug (facultatif — généré automatiquement depuis le titre si vide)">
        <Input type="text" pattern="[a-z0-9-]+" placeholder="fuite-eau-que-faire" />
      </Field>

      <Field name="description" label="Description (155 caractères max, utilisée pour le référencement)">
        <Textarea required maxLength={155} rows={2} />
      </Field>

      <Field name="authorName" label="Auteur">
        <Input type="text" required defaultValue={siteConfig.contactName} />
      </Field>

      <Field name="relatedServiceSlug" label="Service lié (facultatif)">
        <Select defaultValue="">
          <option value="">Aucun</option>
          {siteConfig.services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.title}
            </option>
          ))}
        </Select>
      </Field>

      {/* L'éditeur gère lui-même son champ caché « body » : le Field ne fournit ici que le label. */}
      <Field name="body" label="Contenu">
        <div className="mt-1">
          <ArticleEditor name="body" defaultValue="" />
        </div>
      </Field>
    </Form>
  );
}
