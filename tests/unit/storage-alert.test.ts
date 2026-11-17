import { beforeEach, describe, expect, it, vi } from "vitest";

import { createStorageAlert, hasCrossedWarning } from "@/features/contact/storage-alert";
import type { StorageUsage } from "@/lib/upload-limits";

const MAX = 1000;
const usage = (usedBytes: number): StorageUsage => ({
  usedBytes,
  maxBytes: MAX,
  percent: Math.floor((usedBytes / MAX) * 100),
});

describe("hasCrossedWarning (seuil à 80 %)", () => {
  it("vrai quand l'envoi fait passer de sous 80 % à 80 % pile", () => {
    expect(hasCrossedWarning(usage(800), 100)).toBe(true);
  });

  it("vrai quand l'envoi dépasse largement le seuil", () => {
    expect(hasCrossedWarning(usage(950), 300)).toBe(true);
  });

  it("faux tant que le seuil n'est pas atteint", () => {
    expect(hasCrossedWarning(usage(799), 100)).toBe(false);
  });

  it("faux si le stockage était déjà au-dessus avant l'envoi (pas de rappel)", () => {
    expect(hasCrossedWarning(usage(900), 50)).toBe(false);
  });

  it("faux sans pièce jointe", () => {
    expect(hasCrossedWarning(usage(900), 0)).toBe(false);
  });
});

describe("createStorageAlert", () => {
  const sendWarning = vi.fn(async () => {});
  const listRecipients = vi.fn(async () => ["admin@exemple.test"]);

  beforeEach(() => {
    sendWarning.mockClear();
    listRecipients.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("envoie un e-mail avec le pourcentage au franchissement du seuil", async () => {
    const alert = createStorageAlert({ getUsage: async () => usage(850), listRecipients, sendWarning });

    await alert(100);

    expect(sendWarning).toHaveBeenCalledWith("admin@exemple.test", 85);
  });

  it("n'envoie rien et ne lit pas la base quand le seuil n'est pas franchi", async () => {
    const alert = createStorageAlert({ getUsage: async () => usage(500), listRecipients, sendWarning });

    await alert(100);

    expect(sendWarning).not.toHaveBeenCalled();
    expect(listRecipients).not.toHaveBeenCalled();
  });

  it("ne mesure même pas le disque pour une demande sans pièce jointe", async () => {
    const getUsage = vi.fn(async () => usage(900));
    const alert = createStorageAlert({ getUsage, listRecipients, sendWarning });

    await alert(0);

    expect(getUsage).not.toHaveBeenCalled();
  });

  it("ne lève jamais d'erreur si la mesure ou l'envoi échoue", async () => {
    const failingUsage = createStorageAlert({
      getUsage: async () => {
        throw new Error("EACCES");
      },
      listRecipients,
      sendWarning,
    });
    const failingSend = createStorageAlert({
      getUsage: async () => usage(850),
      listRecipients,
      sendWarning: async () => {
        throw new Error("SMTP down");
      },
    });

    await expect(failingUsage(100)).resolves.toBeUndefined();
    await expect(failingSend(100)).resolves.toBeUndefined();
  });
});
