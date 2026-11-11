"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { IconChevronLeft, IconChevronRight, IconClose } from "@/components/ui/icons";

export type CarouselImage = { src: string; alt: string };

type ImageCarouselModalProps = {
  open: boolean;
  title: string;
  description: string;
  images: CarouselImage[];
  onClose: () => void;
};

/*
 * Générique (components/ui, aucune connaissance du métier) : <dialog> natif, focus trap et
 * fermeture à Échap gérés par le navigateur — pas de JS de focus-trap à écrire (CLAUDE.md, section 7).
 * Même logique de carousel (précédent/suivant, légende "Photo x sur y") que AttachmentGallery.tsx
 * (features/leads/components/AttachmentGallery.tsx), adaptée en vue plein cadre dans une modal.
 */
export function ImageCarouselModal({ open, title, description, images, onClose }: ImageCarouselModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setIndex(0);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const current = images[index];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="realisation-modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-full max-w-2xl rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-0 text-(--color-text) backdrop:bg-black/60"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 id="realisation-modal-title" className="text-xl font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-(--radius-md) text-(--color-text-muted) hover:text-(--color-text)"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {current && (
          <div className="relative h-72 w-full overflow-hidden rounded-(--radius-md) bg-(--color-surface-muted) sm:h-96">
            <Image src={current.src} alt={current.alt} fill sizes="(min-width: 768px) 672px, 100vw" className="object-contain" />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                  aria-label="Image précédente"
                  className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-(--color-surface) text-(--color-text) shadow"
                >
                  <IconChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % images.length)}
                  aria-label="Image suivante"
                  className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-(--color-surface) text-(--color-text) shadow"
                >
                  <IconChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        )}

        {images.length > 1 && (
          <p aria-live="polite" className="text-sm text-(--color-text-muted)">
            Photo {index + 1} sur {images.length}
          </p>
        )}

        <p className="text-(--color-text-muted)">{description}</p>
      </div>
    </dialog>
  );
}
