"use client";

import type { ComponentPropsWithoutRef } from "react";

import { controlClass } from "./control-style";
import { useFieldContext } from "./form-context";

export function Textarea({ className, ...props }: Omit<ComponentPropsWithoutRef<"textarea">, "id" | "name">) {
  const field = useFieldContext("Textarea");
  return (
    <textarea
      {...props}
      id={field.id}
      name={field.name}
      aria-invalid={field.invalid}
      aria-describedby={field.describedBy}
      className={controlClass(className)}
    />
  );
}
