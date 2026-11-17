import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/features/admin-auth";
import { drizzleLeadRepository, LEADS_PAGE_SIZE, LeadsPagination, parsePage, totalPages } from "@/features/leads";

export const metadata: Metadata = {
  title: "Demandes",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

const BADGE_BASE = "ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  await requireAdmin();

  const { page: rawPage } = await searchParams;
  // Le nombre de pages dépend du total : on le lit d'abord, puis on borne le numéro demandé dans l'URL.
  const { total } = await drizzleLeadRepository.counts();
  const pages = totalPages(total);
  const page = parsePage(rawPage, pages);
  const { leads } = await drizzleLeadRepository.listPage(page, LEADS_PAGE_SIZE);

  return (
    <section aria-labelledby="leads-title">
      <h1 id="leads-title" className="text-2xl font-bold">
        Demandes de contact
      </h1>

      {leads.length === 0 ? (
        <p className="mt-4 text-(--color-text-muted)">Aucune demande pour le moment.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/admin/leads/${lead.id}`}
                className="flex flex-col gap-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 hover:border-(--color-primary) sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {lead.name}
                    {lead.status === "new" && (
                      <span className={`${BADGE_BASE} bg-(--color-accent-soft) text-(--color-accent)`}>Nouveau</span>
                    )}
                    {lead.status === "done" && (
                      <span className={`${BADGE_BASE} bg-(--color-surface-muted) text-(--color-text-muted)`}>
                        Traitée
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-(--color-text-muted)">{lead.subject}</p>
                </div>
                <p className="text-sm text-(--color-text-muted)">{dateFormatter.format(lead.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <LeadsPagination page={page} pages={pages} />
    </section>
  );
}
