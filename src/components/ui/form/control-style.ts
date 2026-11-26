import { mergeControlClass } from "./form-logic";

/*
 * Style de base commun aux contrôles de formulaire (tokens du design system, texte 16 px, cible ≥ 44 px).
 * Chaque contrôle (Input, Textarea, Select, FileInput) a son propre fichier : la logique propre à un type de champ
 * s'ajoute là, sans toucher aux autres. `className` de l'appelant s'ajoute au style de base.
 */
export const CONTROL_BASE_CLASS =
  "mt-1 w-full min-h-11 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-3 text-base text-(--color-text) focus-visible:outline-3 focus-visible:outline-(--color-primary)";

// Champ fichier : style natif du navigateur (pas de cadre) ; l'appelant peut en ajouter un.
export const FILE_BASE_CLASS = "mt-1 w-full text-sm";

export function controlClass(className?: string): string {
  return mergeControlClass(CONTROL_BASE_CLASS, className);
}

export function fileControlClass(className?: string): string {
  return mergeControlClass(FILE_BASE_CLASS, className);
}
