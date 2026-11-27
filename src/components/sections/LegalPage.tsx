import { MobileCallBar } from "@/components/sections/MobileCallBar";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import type { LegalDocument, LegalSection } from "@/content/legal";

function LegalSectionBlock({ section }: { section: LegalSection }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{section.title}</h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="mt-3">
          {paragraph}
        </p>
      ))}
      {section.items && (
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.link && (
        <p className="mt-3">
          <a href={section.link.href} className="inline-flex min-h-11 items-center underline">
            {section.link.label}
          </a>
        </p>
      )}
    </section>
  );
}

// Mise en page commune aux pages légales, avec le même en-tête et pied de page que le reste du site.
export function LegalPage({ content }: { content: LegalDocument }) {
  return (
    <>
      <SiteHeader />
      {/* break-words : un numéro, une adresse ou un placeholder long ne doit pas élargir l'écran mobile. */}
      <main id="contenu" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 break-words">
        <h1 className="text-3xl font-extrabold">{content.title}</h1>
        <p className="mt-2 text-sm text-(--color-text-muted)">Dernière mise à jour : {content.updatedAt}</p>
        {content.sections.map((section) => (
          <LegalSectionBlock key={section.title} section={section} />
        ))}
      </main>
      <SiteFooter />
      <MobileCallBar />
    </>
  );
}
