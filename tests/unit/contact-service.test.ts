import { describe, expect, it, vi } from "vitest";

import type { LeadRepository } from "@/features/leads";
import { createContactService } from "@/features/contact/service";
import type { ContactInput } from "@/features/contact/schema";
import type { AttachmentToStore } from "@/lib/uploads";

const input: ContactInput = {
  name: "Marie Dupont",
  phone: "06 12 34 56 78",
  email: "marie@exemple.fr",
  subject: "Panne de chaudière",
  message: "La chaudière ne démarre plus.",
};

const stored: AttachmentToStore = {
  originalName: "panne.jpg",
  storedPath: "uuid.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 1200,
};

// Faux dépôt (DIP) : le service est testé sans base de données.
function fakeRepository(create = vi.fn(async () => 42)): LeadRepository & { create: typeof create } {
  return {
    create,
    list: vi.fn(async () => []),
    findById: vi.fn(async () => undefined),
    findAttachmentById: vi.fn(async () => undefined),
    markRead: vi.fn(async () => undefined),
  };
}

describe("createContactService.submit", () => {
  it("enregistre la demande et renvoie son identifiant", async () => {
    const repository = fakeRepository();
    const service = createContactService(repository, vi.fn(async () => []));

    expect(await service.submit(input, [])).toBe(42);
    expect(repository.create).toHaveBeenCalledWith(input, []);
  });

  it("n'écrit aucun fichier quand il n'y a pas de pièce jointe", async () => {
    const saveFiles = vi.fn(async () => []);
    const service = createContactService(fakeRepository(), saveFiles);

    await service.submit(input, []);

    expect(saveFiles).not.toHaveBeenCalled();
  });

  it("stocke les pièces jointes puis les transmet au dépôt", async () => {
    const repository = fakeRepository();
    const saveFiles = vi.fn(async () => [stored]);
    const service = createContactService(repository, saveFiles);
    const file = new File(["x"], "panne.jpg", { type: "image/jpeg" });

    await service.submit(input, [file]);

    expect(saveFiles).toHaveBeenCalledWith([file]);
    expect(repository.create).toHaveBeenCalledWith(input, [stored]);
  });

  it("propage l'erreur si l'enregistrement échoue (c'est l'action qui répond au visiteur)", async () => {
    const repository = fakeRepository(
      vi.fn(async () => {
        throw new Error("database is locked");
      }),
    );
    const service = createContactService(repository, vi.fn(async () => []));

    await expect(service.submit(input, [])).rejects.toThrow("database is locked");
  });
});
