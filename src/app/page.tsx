import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { faq } from "@/content/faq";
import { isPlaceholder } from "@/lib/content-guard";
import { drizzleRealisationRepository } from "@/features/realisations";
import { FaqSection } from "@/components/sections/FaqSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { MobileCallBar } from "@/components/sections/MobileCallBar";
import { RealisationsSection } from "@/components/sections/RealisationsSection";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SituationsSection } from "@/components/sections/SituationsSection";
import { WhyUsSection } from "@/components/sections/WhyUsSection";
import { ZonesSection } from "@/components/sections/ZonesSection";

const MAX_HOMEPAGE_REALISATIONS = 6;

export const metadata: Metadata = {
  title: "Dépannage d'urgence",
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

// Tant que le nom ou le téléphone restent des TODO(contenu), on n'envoie pas de fausses données
// structurées aux moteurs de recherche (CLAUDE.md, section 12 : ne jamais inventer).
const businessInfoReady = !isPlaceholder(siteConfig.name) && !isPlaceholder(siteConfig.phone.display);

function LocalBusinessJsonLd() {
  if (!businessInfoReady) return null;

  const addressReady =
    !isPlaceholder(siteConfig.address.street) &&
    !isPlaceholder(siteConfig.address.postalCode) &&
    !isPlaceholder(siteConfig.address.city);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["HVACBusiness", "Plumber"],
    name: siteConfig.name,
    telephone: siteConfig.phone.display,
    // url omise tant que le nom de domaine réel n'est pas connu : jamais le domaine TODO(contenu).
    ...(isPlaceholder(siteConfig.url) ? {} : { url: siteConfig.url }),
    email: siteConfig.email,
    areaServed: siteConfig.areas.filter((area) => !isPlaceholder(area)),
    ...(isPlaceholder(siteConfig.legalName) ? {} : { legalName: siteConfig.legalName }),
    ...(isPlaceholder(siteConfig.siret) ? {} : { taxID: siteConfig.siret }),
    ...(addressReady
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: siteConfig.address.street,
            postalCode: siteConfig.address.postalCode,
            addressLocality: siteConfig.address.city,
            addressCountry: siteConfig.address.country,
          },
        }
      : {}),
  };

  // JSON-LD généré côté serveur à partir de données de confiance (config/site.ts), pas d'entrée utilisateur.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

function FaqJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  // Même raisonnement que LocalBusinessJsonLd : données de confiance (content/faq.ts), pas d'entrée utilisateur.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export default async function HomePage() {
  const [realisations, realisationsCount] = await Promise.all([
    drizzleRealisationRepository.listWithPhotos(MAX_HOMEPAGE_REALISATIONS),
    drizzleRealisationRepository.countAll(),
  ]);

  return (
    <>
      <LocalBusinessJsonLd />
      <FaqJsonLd />
      <SiteHeader />
      <main id="contenu" className="flex-1">
        <HeroSection />
        <SituationsSection />
        <ServicesSection />
        <HowItWorksSection />
        <RealisationsSection realisations={realisations} totalCount={realisationsCount} />
        <ReviewsSection />
        <WhyUsSection />
        <ZonesSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
      <MobileCallBar />
    </>
  );
}
