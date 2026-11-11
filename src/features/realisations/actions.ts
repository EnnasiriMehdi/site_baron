"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/features/admin-auth";
import { storePublicImage, validatePublicImage } from "@/lib/public-image-upload";

import { drizzleRealisationRepository } from "./repository";
import { realisationSchema } from "./schema";

export type RealisationFormState = { error: string } | null;

export async function createRealisationAction(
  _previous: RealisationFormState,
  formData: FormData,
): Promise<RealisationFormState> {
  // Revérification de session (CLAUDE.md, section 8.1) : une Server Action peut être appelée
  // indépendamment du rendu de la page admin qui la protège.
  await requireAdmin();

  const parsed = realisationSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    photoAlt: formData.get("photoAlt"),
    relatedServiceSlug: formData.get("relatedServiceSlug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const photo = formData.get("photo");
  if (typeof photo === "string" || photo === null || photo.size === 0) {
    return { error: "Une photo est requise." };
  }

  const imageCheck = validatePublicImage(photo);
  if (!imageCheck.ok) {
    return { error: imageCheck.error };
  }

  // Emplacements optionnels "Photo 2" à "Photo 5" pour le carousel de la modal (RealisationForm.tsx) :
  // tout est validé avant la moindre écriture, pour ne jamais créer une réalisation à moitié remplie
  // si une des photos supplémentaires est invalide.
  const extraPhotos: { file: File; alt: string }[] = [];
  for (let slot = 2; slot <= 5; slot++) {
    const extraPhoto = formData.get(`photo${slot}`);
    if (typeof extraPhoto === "string" || extraPhoto === null || extraPhoto.size === 0) continue;

    const extraAlt = formData.get(`photo${slot}Alt`);
    if (typeof extraAlt !== "string" || extraAlt.trim().length === 0) {
      return { error: `Texte alternatif requis pour la photo ${slot}.` };
    }

    const extraCheck = validatePublicImage(extraPhoto);
    if (!extraCheck.ok) {
      return { error: `Photo ${slot} : ${extraCheck.error}` };
    }

    extraPhotos.push({ file: extraCheck.file, alt: extraAlt.trim() });
  }

  const photoPath = await storePublicImage(imageCheck.file, "realisations");
  const realisationId = await drizzleRealisationRepository.create({ ...parsed.data, photoPath });

  for (const [index, extra] of extraPhotos.entries()) {
    const extraPath = await storePublicImage(extra.file, "realisations");
    await drizzleRealisationRepository.addPhoto(realisationId, {
      photoPath: extraPath,
      photoAlt: extra.alt,
      position: index + 1,
    });
  }

  // La section d'accueil lit la base directement dans page.tsx : sans ceci, elle resterait en cache.
  revalidatePath("/");
  revalidatePath("/realisations");
  revalidatePath("/admin/realisations");

  redirect("/admin/realisations");
}

export async function deleteRealisationAction(id: number): Promise<void> {
  await requireAdmin();
  await drizzleRealisationRepository.delete(id);
  revalidatePath("/");
  revalidatePath("/admin/realisations");
}
