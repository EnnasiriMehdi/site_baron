"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";

import { ALLOWED_IMAGE_MIME_TYPES, MAX_FILES, MAX_FILE_BYTES } from "@/lib/upload-limits";

import { submitContactAction, type ContactFormState } from "../actions";
import { compressImage } from "../image-compression";
import { ContactSuccess } from "./ContactSuccess";

const initialState: ContactFormState = null;
const MAX_FILE_MB = MAX_FILE_BYTES / 1024 / 1024;
const ACCEPT_ATTR = ALLOWED_IMAGE_MIME_TYPES.join(",");

const inputClass =
  "mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-base text-(--color-text)";

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="mt-1 text-sm text-(--color-danger)">
      {messages[0]}
    </p>
  );
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, initialState);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  // Confort immédiat seulement : la vraie limite est revérifiée côté serveur (lib/uploads.ts),
  // avec la même constante partagée (CLAUDE.md, 7quater.2).
  const [fileError, setFileError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  // Numéro de la sélection en cours : si le visiteur change ses fichiers pendant l'allègement,
  // le résultat de l'ancienne sélection est ignoré.
  const selectionId = useRef(0);

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

  if (state?.ok) {
    return <ContactSuccess />;
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6 text-left"
      aria-describedby={state && !state.ok && state.error ? "contact-error" : undefined}
    >
      {/* Honeypot : invisible et ignoré par un visiteur, souvent rempli par un robot (CLAUDE.md, 8.2). */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Laissez ce champ vide</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nom et prénom
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          aria-describedby={fieldErrors?.name ? "name-error" : undefined}
          className={inputClass}
        />
        <FieldError id="name-error" messages={fieldErrors?.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            aria-describedby={fieldErrors?.phone ? "phone-error" : undefined}
            className={inputClass}
          />
          <FieldError id="phone-error" messages={fieldErrors?.phone} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-describedby={fieldErrors?.email ? "email-error" : undefined}
            className={inputClass}
          />
          <FieldError id="email-error" messages={fieldErrors?.email} />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium">
          Objet
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          placeholder="Ex. : panne de chaudière, devis climatisation…"
          aria-describedby={fieldErrors?.subject ? "subject-error" : undefined}
          className={inputClass}
        />
        <FieldError id="subject-error" messages={fieldErrors?.subject} />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Votre message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          aria-describedby={fieldErrors?.message ? "message-error" : undefined}
          className={inputClass}
        />
        <FieldError id="message-error" messages={fieldErrors?.message} />
      </div>

      <div>
        <label htmlFor="attachments" className="block text-sm font-medium">
          Pièces jointes (facultatif)
        </label>
        <input
          id="attachments"
          name="attachments"
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          onChange={handleFilesChange}
          aria-describedby={fileError ? "attachments-error" : "attachments-help"}
          className={`${inputClass} file:mr-3 file:rounded-(--radius-md) file:border-0 file:bg-(--color-primary-soft) file:px-3 file:py-2 file:text-(--color-primary)`}
        />
        <p id="attachments-help" className="mt-1 text-sm text-(--color-text-muted)">
          Photos ou captures d&apos;écran (JPG, PNG, WEBP), {MAX_FILES} fichiers maximum (ex. : photo de la
          panne, capture d&apos;un devis). Elles sont allégées automatiquement avant l&apos;envoi.
        </p>
        {compressing && (
          <p role="status" className="mt-1 text-sm text-(--color-text-muted)">
            Optimisation des photos en cours…
          </p>
        )}
        {fileError && (
          <p id="attachments-error" role="alert" className="mt-1 text-sm text-(--color-danger)">
            {fileError}
          </p>
        )}
      </div>

      <div role="alert" aria-live="assertive" className="min-h-6">
        {state && !state.ok && state.error && (
          <p id="contact-error" className="text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || compressing}
        className="min-h-11 self-start rounded-(--radius-md) border border-(--color-primary) px-6 py-3 font-semibold text-(--color-primary) disabled:opacity-60"
      >
        {pending ? "Envoi en cours…" : compressing ? "Optimisation des photos…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
