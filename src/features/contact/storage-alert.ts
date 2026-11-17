import "server-only";

import { STORAGE_WARNING_RATIO, type StorageUsage } from "@/lib/upload-limits";

type Deps = {
  getUsage(): Promise<StorageUsage>;
  listRecipients(): Promise<string[]>;
  sendWarning(recipient: string, percent: number): Promise<void>;
};

/*
 * Vrai uniquement si CET envoi fait passer le stockage de « sous le seuil » à « au seuil ou au-dessus ».
 * Sans état : rien à mémoriser, un redémarrage ne provoque ni doublon ni oubli. Si deux envois franchissent
 * le seuil en même temps, l'admin peut recevoir deux e-mails (ou un seul) : accepté, voir risk.md R7.
 */
export function hasCrossedWarning(usage: StorageUsage, addedBytes: number): boolean {
  const threshold = usage.maxBytes * STORAGE_WARNING_RATIO;
  const before = usage.usedBytes - addedBytes;
  return addedBytes > 0 && before < threshold && usage.usedBytes >= threshold;
}

function logFailure(error: unknown): void {
  // Nom de l'erreur seulement : jamais d'adresse dans les logs (CLAUDE.md, section 8.4).
  console.error(
    `Échec de l'alerte de stockage des pièces jointes (${error instanceof Error ? error.name : "erreur inconnue"}).`,
  );
}

/*
 * Appelée après chaque demande avec le poids de ses pièces jointes. Ne lève jamais d'erreur : la demande est
 * déjà enregistrée. Un seul e-mail au franchissement du seuil, pas de rappel ensuite (la carte du tableau de
 * bord reste affichée en permanence).
 */
export function createStorageAlert(deps: Deps): (addedBytes: number) => Promise<void> {
  return async (addedBytes) => {
    try {
      if (addedBytes <= 0) return;

      const usage = await deps.getUsage();
      if (!hasCrossedWarning(usage, addedBytes)) return;

      const recipients = await deps.listRecipients();
      const results = await Promise.allSettled(
        recipients.map((recipient) => deps.sendWarning(recipient, usage.percent)),
      );
      for (const result of results) {
        if (result.status === "rejected") logFailure(result.reason);
      }
    } catch (error) {
      logFailure(error);
    }
  };
}
