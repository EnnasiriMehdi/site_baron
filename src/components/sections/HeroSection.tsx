import Image from "next/image";

import { siteConfig } from "@/config/site";
import { heroHighlights } from "@/content/home";
import { IconCheck, IconPhone } from "@/components/ui/icons";

export function HeroSection() {
  return (
    <>
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <Image
          src="/images/technicien-reglage-chaudiere.png"
          alt={`Technicien ${siteConfig.name} réglant une chaudière murale`}
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        {/* Voile sombre : lisibilité garantie du texte clair quel que soit le contenu de la photo
            (contraste vérifié ≥ 4.5:1 même sur les zones les plus claires de l'image). */}
        <div className="absolute inset-0 -z-10 bg-(--color-text)/70" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-24">
          <div className="max-w-xl">
            <p className="inline-flex rounded-full bg-(--color-primary-soft) px-3 py-1 text-sm font-semibold text-(--color-primary)">
              Particuliers &amp; professionnels
            </p>
            <h1 id="hero-title" className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-(--color-primary-contrast) sm:text-6xl">
              Une panne ?
              <span className="block italic text-(--color-primary-soft)">On s&apos;en occupe vite.</span>
            </h1>
            <p className="mt-6 text-lg text-(--color-primary-contrast)/85">
              Chauffage en panne, climatisation qui ne répond plus, fuite d&apos;eau : décrivez le problème par
              téléphone, on vous indique le délai et le prix avant qu&apos;un technicien ne se déplace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={siteConfig.phone.href}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-(--color-accent) px-6 py-3 text-lg font-semibold text-(--color-accent-contrast)"
              >
                <IconPhone className="h-5 w-5" />
                Appeler maintenant
              </a>
              <a
                href="#besoins"
                className="inline-flex min-h-11 items-center justify-center rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-6 py-3 font-semibold text-(--color-text)"
              >
                Quelle est votre situation ?
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bandeau de repères : rythme visuel entre le hero et le reste, rappels courts et vrais. */}
      <div className="bg-(--color-primary) py-4">
        <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-10 gap-y-2 px-4 text-sm font-medium text-(--color-primary-contrast) sm:justify-between">
          {heroHighlights.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
