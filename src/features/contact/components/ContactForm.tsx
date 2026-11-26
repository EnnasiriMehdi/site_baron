"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import { FileInput, Field, Form, Input, SubmitButton, Textarea, type FieldErrors } from "@/components/ui/form";
import { compressImage } from "@/lib/image-compression";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_FILES, MAX_FILE_BYTES } from "@/lib/upload-limits";

import { issueFormTokenAction, submitContactAction, type ContactFormState } from "../actions";
import { ContactSuccess } from "./ContactSuccess";

const initialState: ContactFormState = null;
const MAX_FILE_MB = MAX_FILE_BYTES / 1024 / 1024;
const ACCEPT_ATTR = ALLOWED_IMAGE_MIME_TYPES.join(",");

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactAction, initialState);
  const serverFieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  // Confort immédiat seulement : la vraie limite est revérifiée côté serveur (lib/uploads.ts),
  // avec la même constante partagée (CLAUDE.md, 7quater.2).
  const [fileError, setFileError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  // Numéro de la sélection en cours : si le visiteur change ses fichiers pendant l'allègement,
  // le résultat de l'ancienne sélection est ignoré.
  const selectionId = useRef(0);

  // Erreurs du serveur + erreur de sélection de fichiers (côté navigateur) affichées par le même <Field>.
  // Mémorisé : un objet neuf à chaque rendu relancerait le focus sur le premier champ invalide.
  const fieldErrors = useMemo<FieldErrors | undefined>(
    () => (fileError ? { ...serverFieldErrors, attachments: [fileError] } : serverFieldErrors),
    [serverFieldErrors, fileError],
  );

  // Jeton anti-robot (form-token.ts) demandé à l'affichage : la page de contact est statique, un jeton
  // ne peut donc pas être intégré au rendu. Sans lui (script qui poste sans charger la page), l'envoi
  // est refusé par le serveur.
  const [formToken, setFormToken] = useState("");
  useEffect(() => {
    issueFormTokenAction()
      .then(setFormToken)
      .catch(() => undefined); // échec : le serveur refusera l'envoi avec un message invitant à recharger
  }, []);

  // Les photos sont allégées ici (image-compression.ts) puis remplacent la sélection du champ : le
  // formulaire envoie ensuite les versions légères, sans autre changement.
  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget; // à lire avant tout await
    const files = Array.from(input.files ?? []);
    const currentSelection = ++selectionId.current;

    if (files.length > MAX_FILES) {
      setCompressing(false);
      setFileError(`${MAX_FILES} pièces jointes maximum (${files.length} sélectionnées).`);
      return;
    }

    setFileError(null);
    setCompressing(files.length > 0);

    const optimized: File[] = [];
    for (const file of files) {
      optimized.push(await compressImage(file));
    }
    if (currentSelection !== selectionId.current) return;
    setCompressing(false);

    const tooLarge = optimized.find((file) => file.size > MAX_FILE_BYTES);
    if (tooLarge) {
      setFileError(`"${tooLarge.name}" dépasse ${MAX_FILE_MB} Mo, même après allègement.`);
      return;
    }

    const transfer = new DataTransfer();
    optimized.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
  }

  return (
    <Form
      action={formAction}
      error={state && !state.ok ? state.error : undefined}
      fieldErrors={fieldErrors}
      success={state?.ok ? <ContactSuccess /> : undefined}
      className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6 text-left"
      actions={
        <SubmitButton
          variant="primaryOutline"
          pendingLabel="Envoi en cours…"
          disabled={compressing}
          className="self-start"
        >
          {compressing ? "Optimisation des photos…" : "Envoyer ma demande"}
        </SubmitButton>
      }
    >
      {/* Honeypot : invisible et ignoré par un visiteur, souvent rempli par un robot (CLAUDE.md, 8.2). */}
      <input type="hidden" name="formToken" value={formToken} />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Laissez ce champ vide</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field name="name" label="Nom et prénom">
        <Input type="text" autoComplete="name" required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="phone" label="Téléphone">
          <Input type="tel" inputMode="tel" autoComplete="tel" required />
        </Field>
        <Field name="email" label="E-mail">
          <Input type="email" inputMode="email" autoComplete="email" required />
        </Field>
      </div>

      <Field name="subject" label="Objet">
        <Input type="text" required placeholder="Ex. : panne de chaudière, devis climatisation…" />
      </Field>

      <Field name="message" label="Votre message">
        <Textarea rows={5} required />
      </Field>

      <Field
        name="attachments"
        label="Pièces jointes (facultatif)"
        hint={`Photos ou captures d'écran (JPG, PNG, WEBP), ${MAX_FILES} fichiers maximum (ex. : photo de la panne, capture d'un devis). Elles sont allégées automatiquement avant l'envoi.`}
      >
        <FileInput
          multiple
          accept={ACCEPT_ATTR}
          onChange={handleFilesChange}
          className="rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-base text-(--color-text) file:mr-3 file:rounded-(--radius-md) file:border-0 file:bg-(--color-primary-soft) file:px-3 file:py-2 file:text-(--color-primary)"
        />
        {compressing && (
          <p role="status" className="mt-1 text-sm text-(--color-text-muted)">
            Optimisation des photos en cours…
          </p>
        )}
      </Field>
    </Form>
  );
}
