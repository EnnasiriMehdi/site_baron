"use client";

import type { ComponentPropsWithoutRef } from "react";

import { controlClass } from "./control-style";
import { useFieldContext } from "./form-context";

export function Select({ className, ...props }: Omit<ComponentPropsWithoutRef<"select">, "id" | "name">) {
  const field = useFieldContext("Select");
  return (
    <select
      {...props}
      id={field.id}
      name={field.name}
      aria-invalid={field.invalid}
      aria-describedby={field.describedBy}
      className={controlClass(className)}
    />
  );
}
