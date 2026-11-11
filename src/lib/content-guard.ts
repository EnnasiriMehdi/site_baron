// Évite d'envoyer aux moteurs de recherche des données structurées contenant un placeholder oublié.
export function isPlaceholder(value: string): boolean {
  return value.includes("TODO(contenu)");
}
