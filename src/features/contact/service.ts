import "server-only";

import type { LeadRepository } from "@/features/leads";
import { storeAttachments, type AttachmentToStore } from "@/lib/uploads";
import type { ContactInput } from "./schema";

/*
 * Dépend d'une interface (LeadRepository) et d'une fonction de stockage injectable (DIP) :
 * les tests peuvent remplacer la base et l'écriture sur disque par des doubles.
 */
export function createContactService(
  repository: LeadRepository,
  saveFiles: (files: File[]) => Promise<AttachmentToStore[]> = storeAttachments,
) {
  return {
    async submit(input: ContactInput, files: File[]): Promise<number> {
      const attachments = files.length > 0 ? await saveFiles(files) : [];
      return repository.create(input, attachments);
    },
  };
}

export type ContactService = ReturnType<typeof createContactService>;
