"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { siteConfig } from "@/config/site";
import { useToast } from "@/components/ui/toast/toast";

import { createRealisationAction, type RealisationFormState } from "../actions";

const initialState: RealisationFormState = null;

export function RealisationForm() {
  const [state, action, pending] = useActionState(createRealisationAction, initialState);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!state) return;
    if ("error" in state) {
      toast.error(state.error);
      return;
    }
    toast.success("Réalisation ajoutée.");
    router.push("/admin/realisations");
  }, [state, toast, router]);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Titre
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={160}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={500}
          rows={4}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="relatedServiceSlug" className="block text-sm font-medium">
          Métier concerné (facultatif)
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
        <label htmlFor="photo" className="block text-sm font-medium">
          Photo (JPG, PNG ou WEBP, 5 Mo maximum)
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="mt-1 w-full text-sm"
        />
      </div>

      <div>
        <label htmlFor="photoAlt" className="block text-sm font-medium">
          Texte alternatif de la photo
        </label>
        <input
          id="photoAlt"
          name="photoAlt"
          type="text"
          required
          maxLength={160}
          placeholder="Décrit ce que montre la photo, pour l'accessibilité et le référencement"
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
      </div>

      <fieldset className="rounded-(--radius-md) border border-(--color-border) p-4">
        <legend className="px-1 text-sm font-medium">
          Photos supplémentaires (facultatif, pour le carousel au clic)
        </legend>
        <div className="flex flex-col gap-4">
          {[2, 3, 4, 5].map((slot) => (
            <div key={slot} className="grid gap-2 sm:grid-cols-2">
              <div>
                <label htmlFor={`photo${slot}`} className="block text-sm">
                  Photo {slot}
                </label>
                <input
                  id={`photo${slot}`}
                  name={`photo${slot}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-1 w-full text-sm"
                />
              </div>
              <div>
                <label htmlFor={`photo${slot}Alt`} className="block text-sm">
                  Texte alternatif
                </label>
                <input
                  id={`photo${slot}Alt`}
                  name={`photo${slot}Alt`}
                  type="text"
                  maxLength={160}
                  className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 self-start rounded-(--radius-md) bg-(--color-primary) px-5 py-3 font-semibold text-(--color-primary-contrast) disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Ajouter la réalisation"}
      </button>
    </form>
  );
}
