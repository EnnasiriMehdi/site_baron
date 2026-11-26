"use client";

import { useRef, type ChangeEvent, type ComponentPropsWithoutRef } from "react";

import { compressImage } from "@/lib/image-compression";

import { fileControlClass } from "./control-style";
import { useFieldContext } from "./form-context";

type FileInputProps = Omit<ComponentPropsWithoutRef<"input">, "id" | "name" | "type"> & {
  // Plus grand côté en pixels : les photos choisies sont allégées dans le navigateur avant l'envoi.
  optimizeImages?: number;
};

// Champ fichier : mêmes liens label / erreur / aide que les autres contrôles.
export function FileInput({ className, optimizeImages, onChange, ...props }: FileInputProps) {
  const field = useFieldContext("FileInput");
  const selectionId = useRef(0);

  // Remplace la sélection par les versions allégées. Tant que ce n'est pas fini, le champ est déclaré
  // invalide : le navigateur bloque l'envoi et affiche le message.
  async function optimizeSelection(input: HTMLInputElement, maxSide: number) {
    const files = Array.from(input.files ?? []);
    const currentSelection = ++selectionId.current;
    input.setCustomValidity(files.length > 0 ? "Optimisation des photos en cours…" : "");

    const optimized: File[] = [];
    for (const file of files) {
      optimized.push(await compressImage(file, { maxSide, alwaysReencode: true }));
    }
    // Nouvelle sélection entre-temps : c'est elle qui rendra le champ valide.
    if (currentSelection !== selectionId.current) return;

    try {
      if (optimized.length > 0) {
        const transfer = new DataTransfer();
        optimized.forEach((file) => transfer.items.add(file));
        input.files = transfer.files;
      }
    } finally {
      input.setCustomValidity("");
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
    if (optimizeImages !== undefined) void optimizeSelection(event.currentTarget, optimizeImages);
  }

  return (
    <input
      {...props}
      type="file"
      id={field.id}
      name={field.name}
      aria-invalid={field.invalid}
      aria-describedby={field.describedBy}
      className={fileControlClass(className)}
      onChange={handleChange}
    />
  );
}
