"use client";

import { useEffect, useRef } from "react";

import { siteConfig } from "@/config/site";

/*
 * Confirmation affichée à la place du formulaire une fois la demande enregistrée. Aucun e-mail n'est
 * envoyé au visiteur : c'est donc son seul retour, il ne doit pas pouvoir passer inaperçu.
 */
export function ContactSuccess() {
  const ref = useRef<HTMLDivElement>(null);

  // Le bouton « Envoyer » qui avait le focus vient de disparaître avec le formulaire : sans ceci le focus
  // retombe en haut de page, la confirmation peut être hors écran sur mobile et n'est pas lue par un
  // lecteur d'écran. focus() fait aussi défiler jusqu'à l'élément, sans animation.
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6"
    >
      <p className="font-semibold text-(--color-primary)">Votre demande a bien été envoyée.</p>
      <p className="mt-2 text-sm text-(--color-text-muted)">
        Nous revenons vers vous par téléphone ou par e-mail. Pour une urgence, appeler reste le moyen le plus
        rapide d&apos;être pris en charge.
      </p>
      <a
        href={siteConfig.phone.href}
        className="mt-4 inline-flex min-h-11 items-center rounded-(--radius-md) bg-(--color-primary) px-6 py-3 font-semibold text-(--color-primary-contrast)"
      >
        Appeler le {siteConfig.phone.display}
      </a>
    </div>
  );
}
