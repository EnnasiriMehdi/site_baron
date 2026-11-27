import type { Metadata } from "next";

import { LegalPage } from "@/components/sections/LegalPage";
import { siteConfig } from "@/config/site";
import { legalNotice } from "@/content/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Éditeur, immatriculation, hébergeur et médiateur de la consommation du site ${siteConfig.name}.`,
  alternates: { canonical: "/mentions-legales" },
};

export default function LegalNoticePage() {
  return <LegalPage content={legalNotice} />;
}
