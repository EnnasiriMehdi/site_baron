// Sérialise un objet JSON-LD pour l'insérer dans un <script type="application/ld+json">.
// JSON.stringify n'échappe pas "<" : une valeur contenant "</script>" fermerait la balise
// (le navigateur analyse le HTML avant le JSON) et le texte suivant serait exécuté comme du HTML.
// "<" est décodé en "<" par tout parseur JSON, mais le navigateur HTML ne le voit plus.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
