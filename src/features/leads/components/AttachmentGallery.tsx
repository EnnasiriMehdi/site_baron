"use client";

import Image from "next/image";
import { useState } from "react";

import { IconChevronLeft, IconChevronRight, IconDocument, IconDownload } from "@/components/ui/icons";
import type { LeadAttachment } from "@/lib/db/schema";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function viewUrl(id: number): string {
  return `/api/admin/leads/attachments/${id}`;
}

function downloadUrl(id: number): string {
  return `/api/admin/leads/attachments/${id}?download=1`;
}

/*
 * Aperçu inline sûr : le Content-Type servi vient de l'allowlist validée à l'envoi (lib/uploads.ts),
 * jamais du nom de fichier. Le téléchargement forcé reste toujours disponible en secours
 * (CLAUDE.md, 7quater.2).
 */
export function AttachmentGallery({ attachments }: { attachments: LeadAttachment[] }) {
  const images = attachments.filter((a) => a.mimeType.startsWith("image/"));
  const documents = attachments.filter((a) => !a.mimeType.startsWith("image/"));
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div className="flex flex-col gap-6">
      {images.length > 0 && current && (
        <div>
          <div className="relative h-80 w-full overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-muted)">
            <Image
              // Flux dynamique protégé par session, jamais optimisable par le CDN d'images.
              src={viewUrl(current.id)}
              alt={current.originalName}
              fill
              unoptimized
              className="object-contain"
            />
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

          <p aria-live="polite" className="mt-2 flex items-center justify-between text-sm text-(--color-text-muted)">
            <span>
              {current.originalName} · {formatBytes(current.sizeBytes)}
              {images.length > 1 ? ` · Image ${index + 1} sur ${images.length}` : ""}
            </span>
            <a
              href={downloadUrl(current.id)}
              className="inline-flex items-center gap-1 font-semibold text-(--color-primary) underline"
            >
              <IconDownload className="h-4 w-4" />
              Télécharger
            </a>
          </p>

          {images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Voir l'image ${i + 1} sur ${images.length}`}
                  aria-current={i === index}
                  className={`relative h-16 w-16 overflow-hidden rounded-(--radius-md) border-2 ${
                    i === index ? "border-(--color-primary)" : "border-(--color-border)"
                  }`}
                >
                  <Image src={viewUrl(image.id)} alt="" fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {documents.length > 0 && (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-(--radius-md) border border-(--color-border) px-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <IconDocument className="h-5 w-5 shrink-0 text-(--color-text-muted)" />
                <span className="truncate text-sm">
                  {doc.originalName} <span className="text-(--color-text-muted)">({formatBytes(doc.sizeBytes)})</span>
                </span>
              </span>
              <span className="flex shrink-0 gap-3 text-sm font-semibold">
                <a href={viewUrl(doc.id)} target="_blank" rel="noopener noreferrer" className="text-(--color-primary) underline">
                  Ouvrir
                </a>
                <a href={downloadUrl(doc.id)} className="text-(--color-primary) underline">
                  Télécharger
                </a>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
