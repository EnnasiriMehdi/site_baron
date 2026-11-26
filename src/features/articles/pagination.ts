// Nombre fixe : les pages de liste sont préparées à l'avance, l'adresse suffit à savoir quoi afficher.
export const ARTICLES_PER_PAGE = 8;

export function blogTotalPages(total: number): number {
  return Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE));
}

/*
 * Numéro de page lu dans le chemin (/blog/page/3), donc fourni par le visiteur : seul un entier écrit sans zéro en
 * tête et compris entre 1 et la dernière page est accepté. Tout le reste donne `null` (page 404), pour qu'une adresse
 * invalide n'affiche jamais la copie d'une autre page.
 */
export function parseBlogPage(raw: string, pages: number): number | null {
  if (!/^[1-9]\d{0,5}$/.test(raw)) return null;
  const page = Number(raw);
  return page <= pages ? page : null;
}

export function blogPageHref(page: number): string {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}
