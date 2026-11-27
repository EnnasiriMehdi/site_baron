// Détecte un contenu pas encore fourni par le client, pour ne jamais le publier aux moteurs de recherche.
// Deux formes : TODO(contenu) et [<…>] (informations légales et d'entreprise).
export function isPlaceholder(value: string): boolean {
  return value.includes("TODO(contenu)") || value.includes("[<");
}
