import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/features/admin-auth";
import { drizzleLeadRepository, StorageUsageCard } from "@/features/leads";
import { getStorageUsage } from "@/lib/uploads";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  await requireAdmin();
  const { total, unread: newCount } = await drizzleLeadRepository.counts();
  const storage = await getStorageUsage();

  return (
    <section aria-labelledby="dashboard-title">
      <h1 id="dashboard-title" className="text-2xl font-bold">
        Tableau de bord
      </h1>
      <Link
        href="/admin/leads"
        className="mt-6 flex max-w-sm flex-col gap-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6 hover:border-(--color-primary)"
      >
        <p className="text-sm font-medium text-(--color-text-muted)">Demandes de contact</p>
        <p className="text-3xl font-bold">{total}</p>
        {newCount > 0 && (
          <p className="text-sm font-semibold text-(--color-accent)">
            {newCount} nouvelle{newCount > 1 ? "s" : ""}
          </p>
        )}
      </Link>
      <div className="mt-4">
        <StorageUsageCard usage={storage} />
      </div>
    </section>
  );
}
