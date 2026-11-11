"use client";

import Image from "next/image";
import { useState } from "react";

import { ImageCarouselModal, type CarouselImage } from "@/components/ui/ImageCarouselModal";
import type { Realisation, RealisationPhoto } from "@/lib/db/schema";
import { siteConfig } from "@/config/site";

export type RealisationWithPhotos = Realisation & { photos: RealisationPhoto[] };

type RealisationsGridProps = {
  realisations: RealisationWithPhotos[];
};

// Grille de cartes + modal carousel, utilisée à la fois par la section d'accueil
// (RealisationsSection.tsx) et par la page dédiée (/realisations) — composant présentationnel,
// la lecture de la base reste dans les pages (CLAUDE.md, 3.2).
export function RealisationsGrid({ realisations }: RealisationsGridProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = realisations.find((item) => item.id === openId);

  const images: CarouselImage[] = open
    ? [{ src: open.photoPath, alt: open.photoAlt }, ...open.photos.map((p) => ({ src: p.photoPath, alt: p.photoAlt }))]
    : [];

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {realisations.map((realisation) => {
          const service = siteConfig.services.find((item) => item.slug === realisation.relatedServiceSlug);
          return (
            <li
              key={realisation.id}
              className="overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)"
            >
              <button
                type="button"
                onClick={() => setOpenId(realisation.id)}
                className="block w-full text-left"
                aria-haspopup="dialog"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={realisation.photoPath}
                    alt={realisation.photoAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  {service && (
                    <span className="inline-flex rounded-full bg-(--color-primary-soft) px-2.5 py-1 text-xs font-semibold text-(--color-primary)">
                      {service.title}
                    </span>
                  )}
                  <h3 className="mt-2 font-semibold">{realisation.title}</h3>
                  <p className="mt-1 text-sm text-(--color-text-muted)">{realisation.description}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <ImageCarouselModal
        key={open?.id ?? "closed"}
        open={open !== undefined}
        title={open?.title ?? ""}
        description={open?.description ?? ""}
        images={images}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
