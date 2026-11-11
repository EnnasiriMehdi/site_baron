import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { drizzleRealisationRepository } from "@/features/realisations";
import { RealisationsGrid } from "@/components/sections/RealisationsGrid";

export const metadata: Metadata = {
  title: "Nos réalisations",
  description: `Chantiers réalisés par ${siteConfig.name} : chauffage, climatisation et plomberie.`,
  alternates: { canonical: "/realisations" },
};

export default async function RealisationsPage() {
  const realisations = await drizzleRealisationRepository.listWithPhotos();

  return (
    <main id="contenu" className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
      <h1 className="text-3xl font-extrabold">Nos réalisations</h1>
      <p className="mt-2 max-w-2xl text-(--color-text-muted)">
        Un aperçu de nos interventions récentes en chauffage, climatisation et plomberie.
      </p>

      {realisations.length === 0 ? (
        <p className="mt-8 text-(--color-text-muted)">Aucune réalisation publiée pour le moment.</p>
      ) : (
        <div className="mt-8">
          <RealisationsGrid realisations={realisations} />
        </div>
      )}
    </main>
  );
}
