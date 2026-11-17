import { STORAGE_WARNING_RATIO, type StorageUsage } from "@/lib/upload-limits";

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} Go` : `${mb.toFixed(mb < 10 ? 1 : 0)} Mo`;
}

/*
 * Carte permanente du tableau de bord : espace pris par les pièces jointes des demandes. L'avertissement ne
 * repose pas sur la couleur seule (texte + barre), conformément à l'accessibilité (CLAUDE.md, section 7).
 */
export function StorageUsageCard({ usage }: { usage: StorageUsage }) {
  const warning = usage.usedBytes >= usage.maxBytes * STORAGE_WARNING_RATIO;
  const full = usage.percent >= 100;

  return (
    <div
      role="status"
      className={`flex max-w-sm flex-col gap-2 rounded-(--radius-lg) border bg-(--color-surface) p-6 ${
        warning ? "border-(--color-danger)" : "border-(--color-border)"
      }`}
    >
      <p className="text-sm font-medium text-(--color-text-muted)">Stockage des pièces jointes</p>
      <p className="text-3xl font-bold">
        {usage.percent} %
        <span className="ml-2 text-base font-medium text-(--color-text-muted)">
          {formatSize(usage.usedBytes)} / {formatSize(usage.maxBytes)}
        </span>
      </p>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-(--color-surface-muted)"
        role="progressbar"
        aria-label="Espace utilisé par les pièces jointes"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={usage.percent}
      >
        <div
          className={`h-full ${warning ? "bg-(--color-danger)" : "bg-(--color-primary)"}`}
          style={{ width: `${usage.percent}%` }}
        />
      </div>
      {warning && (
        <p className="text-sm font-semibold text-(--color-danger)">
          {full
            ? "Espace plein : les photos jointes sont refusées. Les messages texte passent toujours."
            : "Espace bientôt plein : à 100 %, les photos jointes seront refusées."}
        </p>
      )}
    </div>
  );
}
