import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { requireAdmin } from "@/features/admin-auth";
import { deleteRealisationAction, drizzleRealisationRepository } from "@/features/realisations";

export const metadata: Metadata = {
  title: "Réalisations",
  robots: { index: false, follow: false },
};

export default async function AdminRealisationsPage() {
  await requireAdmin();
  const realisations = await drizzleRealisationRepository.list();

  return (
    <section aria-labelledby="realisations-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="realisations-title" className="text-2xl font-bold">
          Réalisations
        </h1>
        <Link
          href="/admin/realisations/new"
          className="min-h-11 rounded-(--radius-md) bg-(--color-primary) px-4 py-2 font-semibold text-(--color-primary-contrast)"
        >
          Ajouter une réalisation
        </Link>
      </div>

      {realisations.length === 0 ? (
        <p className="mt-4 text-(--color-text-muted)">Aucune réalisation pour le moment.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {realisations.map((realisation) => (
            <li
              key={realisation.id}
              className="flex gap-4 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-(--radius-md)">
                <Image src={realisation.photoPath} alt={realisation.photoAlt} fill sizes="80px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{realisation.title}</p>
                <p className="line-clamp-2 text-sm text-(--color-text-muted)">{realisation.description}</p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteRealisationAction(realisation.id);
                }}
              >
                <button type="submit" className="min-h-11 shrink-0 text-sm font-medium text-(--color-danger) underline">
                  Supprimer
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
