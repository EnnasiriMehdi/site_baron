"use client";

import type { ComponentPropsWithoutRef } from "react";

import { fileControlClass } from "./control-style";
import { useFieldContext } from "./form-context";

// Champ fichier : mêmes liens label / erreur / aide que les autres contrôles.
export function FileInput({ className, ...props }: Omit<ComponentPropsWithoutRef<"input">, "id" | "name" | "type">) {
  const field = useFieldContext("FileInput");
  return (
    <input
      {...props}
      type="file"
      id={field.id}
      name={field.name}
      aria-invalid={field.invalid}
      aria-describedby={field.describedBy}
      className={fileControlClass(className)}
    />
  );
}
