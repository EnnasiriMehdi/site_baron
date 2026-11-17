import "server-only";

import type { LeadRepository } from "@/features/leads";
import { storeAttachments, type AttachmentToStore } from "@/lib/uploads";
import type { ContactInput } from "./schema";

// Seules valeurs maîtrisées par le serveur : rien du texte saisi par le visiteur (CLAUDE.md, section 9).
export type NewLeadNotice = { leadId: number; attachmentCount: number };

/*
 * Dépend d'une interface (LeadRepository) et de fonctions injectables (DIP) :
 * les tests peuvent remplacer la base, l'écriture sur disque et la notification par des doubles.
 */
export function createContactService(
  repository: LeadRepository,
  saveFiles: (files: File[]) => Promise<AttachmentToStore[]> = storeAttachments,
  onLeadCreated: (notice: NewLeadNotice) => void = () => {},
) {
  return {
    async submit(input: ContactInput, files: File[]): Promise<number> {
      const attachments = files.length > 0 ? await saveFiles(files) : [];
      const leadId = await repository.create(input, attachments);

      // La demande est déjà enregistrée : un échec de notification ne doit jamais faire échouer la soumission.
      try {
        onLeadCreated({ leadId, attachmentCount: attachments.length });
      } catch (error) {
        console.error(
          `Échec du déclenchement de la notification de nouvelle demande (${error instanceof Error ? error.name : "erreur inconnue"}).`,
        );
      }

      return leadId;
    },
  };
}

export type ContactService = ReturnType<typeof createContactService>;
