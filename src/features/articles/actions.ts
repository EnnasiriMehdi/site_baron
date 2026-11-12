"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/features/admin-auth";
import { siteConfig } from "@/config/site";
import { storePublicImage, validatePublicImage } from "@/lib/public-image-upload";

import { drizzleArticleRepository } from "./repository";
import { articleSchema, isReadyToPublish } from "./schema";
import { slugify } from "./slug";

export type ArticleFormState = { error: string } | null;

function revalidateArticlePaths(slug: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/articles");
}

function parseArticleFields(formData: FormData) {
  const rawTitle = formData.get("title");
  const rawSlug = formData.get("slug");
  const slug =
    typeof rawSlug === "string" && rawSlug.trim().length > 0
      ? rawSlug
      : slugify(typeof rawTitle === "string" ? rawTitle : "");

  return articleSchema.safeParse({
    title: rawTitle,
    slug,
    description: formData.get("description"),
    body: formData.get("body"),
    authorName: formData.get("authorName"),
    relatedServiceSlug: formData.get("relatedServiceSlug"),
  });
}

export async function createArticleAction(_previous: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  await requireAdmin();

  if (!formData.get("authorName")) formData.set("authorName", siteConfig.contactName);

  const parsed = parseArticleFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  let id: number;
  try {
    id = await drizzleArticleRepository.create(parsed.data);
  } catch {
    return { error: "Ce slug est déjà utilisé par un autre article." };
  }

  redirect(`/admin/articles/${id}/edit`);
}

export async function updateArticleAction(_previous: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  await requireAdmin();

  const idValue = Number(formData.get("id"));
  if (!Number.isInteger(idValue)) return { error: "Article introuvable." };

  const existing = await drizzleArticleRepository.findById(idValue);
  if (!existing) return { error: "Article introuvable." };

  const parsed = parseArticleFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  // Slug figé après publication (CLAUDE.md, 7ter.1) : la validation serveur rejette le changement
  // même si le champ était modifiable dans le formulaire (défense en profondeur, pas confiance au client).
  if (existing.status === "published" && parsed.data.slug !== existing.slug) {
    return { error: "Le slug ne peut plus être modifié : cet article est déjà publié." };
  }

  try {
    await drizzleArticleRepository.update(idValue, parsed.data);
  } catch {
    return { error: "Ce slug est déjà utilisé par un autre article." };
  }

  const photo = formData.get("coverImage");
  const photoAlt = formData.get("coverImageAlt");
  if (photo instanceof File && photo.size > 0) {
    if (typeof photoAlt !== "string" || photoAlt.trim().length === 0) {
      return { error: "Texte alternatif requis pour la photo de couverture." };
    }
    const imageCheck = await validatePublicImage(photo);
    if (!imageCheck.ok) return { error: imageCheck.error };

    const path = await storePublicImage(imageCheck.file, "articles");
    await drizzleArticleRepository.setCoverImage(idValue, path, photoAlt.trim());
  }

  revalidateArticlePaths(parsed.data.slug);
  return null;
}

// L'admin ne peut déclencher cette action que via le bouton "Publier" de la page d'édition, qui
// n'est affiché/actif que lorsque isReadyToPublish(article) est vrai côté serveur (ArticleEditorPage) :
// la vérification ici est une défense en profondeur (jamais de confiance au seul client), pas le
// chemin normal d'erreur utilisateur.
export async function publishArticleAction(id: number): Promise<void> {
  await requireAdmin();

  const existing = await drizzleArticleRepository.findById(id);
  if (!existing || !isReadyToPublish(existing)) return;

  await drizzleArticleRepository.publish(id);
  revalidateArticlePaths(existing.slug);
}

export async function unpublishArticleAction(id: number): Promise<void> {
  await requireAdmin();
  const existing = await drizzleArticleRepository.findById(id);
  if (!existing) return;

  await drizzleArticleRepository.unpublish(id);
  revalidateArticlePaths(existing.slug);
}

// Appelée directement depuis l'éditeur (MDXEditorClient.tsx, imageUploadHandler), pas depuis un
// <form> : Next.js sérialise un File passé en argument d'une Server Action comme n'importe quel
// envoi multipart. Même allowlist stricte (JPG/PNG/WEBP, 5 Mo) que la couverture d'article et les
// réalisations — aucun nouveau chemin de validation à maintenir (CLAUDE.md, 7ter.2).
export async function uploadArticleImageAction(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();

  const imageCheck = await validatePublicImage(file);
  if (!imageCheck.ok) return { ok: false, error: imageCheck.error };

  const url = await storePublicImage(imageCheck.file, "articles");
  return { ok: true, url };
}

export async function deleteArticleAction(id: number): Promise<void> {
  await requireAdmin();
  const existing = await drizzleArticleRepository.findById(id);
  if (!existing) return;

  await drizzleArticleRepository.delete(id);
  revalidateArticlePaths(existing.slug);
}
