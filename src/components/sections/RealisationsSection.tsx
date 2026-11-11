import Link from "next/link";

import { RealisationsGrid, type RealisationWithPhotos } from "@/components/sections/RealisationsGrid";

type RealisationsSectionProps = {
  realisations: RealisationWithPhotos[];
  totalCount: number;
};

// Le seuil (>3) vient de la demande du client : une page dédiée n'est annoncée que si elle vaut
// la visite (voir aussi src/app/realisations/page.tsx, toujours accessible directement).
const DEDICATED_PAGE_THRESHOLD = 3;

// Composant purement présentationnel : la page lit la base (page.tsx), pas ce composant
// (CLAUDE.md, 3.2 — components/* n'importe jamais features/*).
export function RealisationsSection({ realisations, totalCount }: RealisationsSectionProps) {
  if (realisations.length === 0) return null;

  return (
    <section id="realisations" aria-labelledby="realisations-title" className="scroll-mt-28 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="realisations-title" className="text-2xl font-extrabold sm:text-3xl">
          Nos dernières réalisations
        </h2>
        <div className="mt-8">
          <RealisationsGrid realisations={realisations} />
        </div>
        {totalCount > DEDICATED_PAGE_THRESHOLD && (
          <p className="mt-6">
            <Link href="/realisations" className="font-semibold text-(--color-primary) underline">
              Voir toutes nos réalisations
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
