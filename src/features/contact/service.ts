import "server-only";

import type { LeadRepository } from "@/features/leads";
import { storeAttachments, type AttachmentToStore } from "@/lib/uploads";
import type { ContactInput } from "./schema";

/*
 * Dépend d'interfaces (LeadRepository, notify) et d'une fonction de stockage injectable (DIP) :
 * les tests peuvent remplacer l'écriture sur disque et l'envoi d'e-mail par des doubles.
 */
export function createContactService(
  repository: LeadRepository,
  notify: (input: ContactInput) => Promise<void>,
  saveFiles: (files: File[]) => Promise<AttachmentToStore[]> = storeAttachments,
) {
  return {
    async submit(input: ContactInput, files: File[]): Promise<number> {
      const attachments = files.length > 0 ? await saveFiles(files) : [];
      const leadId = await repository.create(input, attachments);

      try {
        await notify(input);
      } catch (error) {
        // La demande est déjà enregistrée : un échec d'e-mail ne doit jamais faire échouer la
        // soumission (jamais d'échec silencieux, mais pas de donnée personnelle dans le log —
        // CLAUDE.md, sections 8.4 et 9).
        console.error(
          `Échec de l'envoi de l'e-mail de confirmation de contact (${error instanceof Error ? error.name : "erreur inconnue"}).`,
        );
      }

      return leadId;
    },
  };
}

export type ContactService = ReturnType<typeof createContactService>;
