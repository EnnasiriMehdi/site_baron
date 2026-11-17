import Link from "next/link";

const LINK_CLASS =
  "inline-flex min-h-11 items-center rounded-(--radius-md) border border-(--color-border) px-4 font-semibold hover:border-(--color-primary)";

function pageHref(page: number): string {
  return page <= 1 ? "/admin/leads" : `/admin/leads?page=${page}`;
}

// Pagination simple : précédent / suivant et « Page X sur Y ». Rien à afficher s'il n'y a qu'une page.
export function LeadsPagination({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;

  return (
    <nav aria-label="Pagination des demandes" className="mt-6 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} rel="prev" className={LINK_CLASS}>
          ← Plus récentes
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <p className="text-sm text-(--color-text-muted)">
        Page {page} sur {pages}
      </p>
      {page < pages ? (
        <Link href={pageHref(page + 1)} rel="next" className={LINK_CLASS}>
          Plus anciennes →
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
