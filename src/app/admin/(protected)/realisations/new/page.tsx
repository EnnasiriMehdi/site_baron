import type { Metadata } from "next";

import { requireAdmin } from "@/features/admin-auth";
import { RealisationForm } from "@/features/realisations/components/RealisationForm";

export const metadata: Metadata = {
  title: "Ajouter une réalisation",
  robots: { index: false, follow: false },
};

export default async function NewRealisationPage() {
  await requireAdmin();

  return (
    <section aria-labelledby="new-realisation-title">
      <h1 id="new-realisation-title" className="text-2xl font-bold">
        Ajouter une réalisation
      </h1>
      <div className="mt-6">
        <RealisationForm />
      </div>
    </section>
  );
}
