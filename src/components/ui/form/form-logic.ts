/*
 * Logique pure des composants de formulaire (sans React) : testable directement.
 * Voir claude_perso/architecture_details.md, section « Composants de formulaire ».
 */

// Forme renvoyée par nos Server Actions (Zod `flatten().fieldErrors`) : nom du champ → messages.
export type FieldErrors = Record<string, string[] | undefined>;

// Une seule référence constante : un `{}` neuf à chaque rendu relancerait l'effet de focus de <Form>.
export const NO_FIELD_ERRORS: FieldErrors = {};

export function firstMessage(errors: FieldErrors, name: string): string | undefined {
  return errors[name]?.[0] || undefined;
}

export function hasAnyError(errors: FieldErrors): boolean {
  return Object.values(errors).some((messages) => Boolean(messages?.length));
}

// Texte complémentaire relié au champ : l'erreur si elle est affichée, sinon l'aide, sinon rien.
// L'erreur remplace l'aide à l'écran : on ne pointe que sur ce qui est réellement présent.
export function describedByIds(ids: { errorId: string; hintId: string; hasError: boolean; hasHint: boolean }): string | undefined {
  if (ids.hasError) return ids.errorId;
  if (ids.hasHint) return ids.hintId;
  return undefined;
}

// Taille de texte : si l'appelant en impose une (`text-lg`), on retire celle du style de base. Deux classes de taille
// sur le même élément se départageraient selon l'ordre du CSS généré, pas selon l'ordre dans l'attribut class.
const TEXT_SIZE = "text-(?:xs|sm|base|lg|xl|2xl|3xl)";

export function mergeControlClass(base: string, extra?: string): string {
  if (!extra) return base;
  const extraHasSize = new RegExp(`(^|\\s)${TEXT_SIZE}(?=\\s|$)`).test(extra);
  const kept = extraHasSize ? base.replace(new RegExp(`(^|\\s)${TEXT_SIZE}(?=\\s|$)`, "g"), "") : base;
  return `${kept.trim()} ${extra}`;
}
