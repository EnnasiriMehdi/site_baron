import Link from "next/link";

import { ContactForm } from "@/features/contact";
import { siteConfig } from "@/config/site";
import { contactPrivacyNotice } from "@/content/legal";
import { IconPhone } from "@/components/ui/icons";

export function FinalCtaSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-28">
      {/* L'appel reste l'action mise en avant : bande pleine couleur, en premier, visuellement dominante. */}
      <div className="bg-(--color-primary) py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 id="contact-title" className="text-2xl font-extrabold text-(--color-primary-contrast) sm:text-3xl">
            Une panne ne prévient jamais à l&apos;avance
          </h2>
          <a
            href={siteConfig.phone.href}
            className="mt-4 block text-[clamp(2.25rem,8vw,5rem)] font-black italic leading-none text-(--color-primary-contrast)"
          >
            {siteConfig.phone.display}
          </a>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href={siteConfig.phone.href}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-(--color-accent) px-8 py-4 text-lg font-semibold text-(--color-accent-contrast)"
            >
              <IconPhone className="h-5 w-5" />
              Appeler maintenant
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex min-h-11 items-center justify-center rounded-(--radius-md) border-2 border-(--color-primary-contrast) px-6 py-4 font-medium text-(--color-primary-contrast)"
            >
              {siteConfig.email}
            </a>
          </div>
        </div>
      </div>

      {/* Le formulaire reste accessible, mais en retrait visuel : plus sobre, après l'appel. */}
      <div className="bg-(--color-surface-muted) py-16">
        <div className="mx-auto max-w-xl px-4">
          <h3 className="text-center text-xl font-semibold">Vous préférez écrire ?</h3>
          <p className="mt-2 text-center text-(--color-text-muted)">
            Décrivez votre besoin, on vous recontacte. Pour une urgence, l&apos;appel reste plus rapide.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
          <p className="mt-4 text-sm break-words text-(--color-text-muted)">
            {contactPrivacyNotice}{" "}
            <Link href="/politique-de-confidentialite" className="underline">
              Voir la politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
