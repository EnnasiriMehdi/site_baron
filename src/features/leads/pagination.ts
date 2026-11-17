// Demandes affichées par page dans /admin/leads.
export const LEADS_PAGE_SIZE = 20;

export function totalPages(total: number, pageSize: number = LEADS_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/*
 * Numéro de page demandé dans l'URL (?page=3). Valeur venue du navigateur : jamais de confiance. Tout ce qui n'est
 * pas un entier ≥ 1 donne la page 1 ; au-delà de la dernière page, on reste sur la dernière.
 */
export function parsePage(raw: string | string[] | undefined, pages: number): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = value !== undefined && /^\d{1,6}$/.test(value) ? Number(value) : 1;
  return Math.min(Math.max(1, parsed), pages);
}
