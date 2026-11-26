"use client";

import { useId, type ReactNode } from "react";

import { FieldContext, useFormContext } from "./form-context";
import { describedByIds, firstMessage } from "./form-logic";

type FieldProps = {
  // Nom envoyé au serveur ET clé de l'erreur à afficher : écrit une seule fois, ici.
  name: string;
  label: string;
  // Aide affichée sous le champ tant qu'il n'y a pas d'erreur (« 12 caractères minimum »).
  hint?: string;
  className?: string;
  // Le contrôle : <Input />, <Textarea />, <Select /> ou un composant qui appelle useFieldContext().
  children: ReactNode;
};

/*
 * Label + contrôle + erreur du champ. Lit son erreur dans le <Form> parent (par `name`), génère les ids (useId :
 * stables entre serveur et navigateur) et relie label, contrôle, erreur et aide pour les lecteurs d'écran.
 */
export function Field({ name, label, hint, className, children }: FieldProps) {
  const form = useFormContext("Field");
  const id = useId();

  const message = firstMessage(form.fieldErrors, name);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const value = {
    id,
    name,
    invalid: Boolean(message),
    describedBy: describedByIds({ errorId, hintId, hasError: Boolean(message), hasHint: Boolean(hint) }),
  };

  return (
    <FieldContext.Provider value={value}>
      <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        {children}
        {message ? (
          <p id={errorId} className="mt-1 text-sm text-(--color-danger)">
            {message}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="mt-1 text-sm text-(--color-text-muted)">
              {hint}
            </p>
          )
        )}
      </div>
    </FieldContext.Provider>
  );
}
