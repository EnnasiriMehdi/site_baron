// Minuscules, accents retirés (NFD + suppression des diacritiques), tout ce qui n'est pas [a-z0-9-]
// remplacé par un tiret, tirets répétés/en bordure supprimés.
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
