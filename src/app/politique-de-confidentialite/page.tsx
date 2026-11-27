import type { Metadata } from "next";

import { LegalPage } from "@/components/sections/LegalPage";
import { siteConfig } from "@/config/site";
import { privacyPolicy } from "@/content/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Données collectées par ${siteConfig.name}, finalités, durée de conservation et exercice de vos droits.`,
  alternates: { canonical: "/politique-de-confidentialite" },
};

export default function PrivacyPolicyPage() {
  return <LegalPage content={privacyPolicy} />;
}
