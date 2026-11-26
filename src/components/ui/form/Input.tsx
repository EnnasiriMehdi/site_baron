"use client";

import type { ComponentPropsWithoutRef } from "react";

import { controlClass } from "./control-style";
import { useFieldContext } from "./form-context";

// Les attributs id / name / aria viennent du <Field> parent et ne se surchargent pas : c'est ce qui garde
// label, erreur et aide correctement reliés.
export function Input({ className, ...props }: Omit<ComponentPropsWithoutRef<"input">, "id" | "name">) {
  const field = useFieldContext("Input");
  return (
    <input
      {...props}
      id={field.id}
      name={field.name}
      aria-invalid={field.invalid}
      aria-describedby={field.describedBy}
      className={controlClass(className)}
    />
  );
}
