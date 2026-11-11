import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/features/admin-auth";
import { drizzleLeadRepository } from "@/features/leads";

export const metadata: Metadata = {
  title: "Demandes",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminLeadsPage() {
  await requireAdmin();
  const leads = await drizzleLeadRepository.list();

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
                      <span className="ml-2 inline-flex rounded-full bg-(--color-accent-soft) px-2 py-0.5 text-xs font-semibold text-(--color-accent)">
                        Nouveau
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
    </section>
  );
}
