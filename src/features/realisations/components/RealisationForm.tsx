"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { siteConfig } from "@/config/site";
import { FileInput, Field, Form, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast/toast";

import { createRealisationAction, type RealisationFormState } from "../actions";

const initialState: RealisationFormState = null;

export function RealisationForm() {
  const [state, action] = useActionState(createRealisationAction, initialState);
  const toast = useToast();
  const router = useRouter();

  // Les erreurs passent par un toast (pas de zone d'erreur dans le formulaire).
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
    <Form
      action={action}
      className="max-w-xl"
      actions={
        <SubmitButton pendingLabel="Enregistrement…" className="self-start">
          Ajouter la réalisation
        </SubmitButton>
      }
    >
      <Field name="title" label="Titre">
        <Input type="text" required maxLength={160} />
      </Field>

      <Field name="description" label="Description">
        <Textarea required maxLength={500} rows={4} />
      </Field>

      <Field name="relatedServiceSlug" label="Métier concerné (facultatif)">
        <Select defaultValue="">
          <option value="">Aucun</option>
          {siteConfig.services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field name="photo" label="Photo (JPG, PNG ou WEBP, 5 Mo maximum)">
        <FileInput accept="image/jpeg,image/png,image/webp" required />
      </Field>

      <Field name="photoAlt" label="Texte alternatif de la photo">
        <Input
          type="text"
          required
          maxLength={160}
          placeholder="Décrit ce que montre la photo, pour l'accessibilité et le référencement"
        />
      </Field>

      <fieldset className="rounded-(--radius-md) border border-(--color-border) p-4">
        <legend className="px-1 text-sm font-medium">
          Photos supplémentaires (facultatif, pour le carousel au clic)
        </legend>
        <div className="flex flex-col gap-4">
          {[2, 3, 4, 5].map((slot) => (
            <div key={slot} className="grid gap-2 sm:grid-cols-2">
              <Field name={`photo${slot}`} label={`Photo ${slot}`}>
                <FileInput accept="image/jpeg,image/png,image/webp" />
              </Field>
              <Field name={`photo${slot}Alt`} label="Texte alternatif">
                <Input type="text" maxLength={160} />
              </Field>
            </div>
          ))}
        </div>
      </fieldset>
    </Form>
  );
}
