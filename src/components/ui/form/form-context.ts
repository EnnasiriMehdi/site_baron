"use client";

import { createContext, useContext } from "react";

import type { FieldErrors } from "./form-logic";

/*
 * Deux contextes :
 * - FormContext  : fourni par <Form>, porte les erreurs de TOUT le formulaire ;
 * - FieldContext : fourni par <Field>, porte l'id et l'état d'UN champ pour son contrôle (Input, Textarea, Select).
 * Un composant utilisé hors de son parent lève une erreur : c'est une faute du développeur, vue au premier rendu.
 */
export type FormContextValue = {
  fieldErrors: FieldErrors;
};

export type FieldContextValue = {
  id: string;
  name: string;
  invalid: boolean;
  describedBy: string | undefined;
};

export const FormContext = createContext<FormContextValue | null>(null);
export const FieldContext = createContext<FieldContextValue | null>(null);

export function useFormContext(consumer: string): FormContextValue {
  const value = useContext(FormContext);
  if (!value) throw new Error(`<${consumer}> doit être placé dans un <Form> (components/ui/form).`);
  return value;
}

export function useFieldContext(consumer: string): FieldContextValue {
  const value = useContext(FieldContext);
  if (!value) throw new Error(`<${consumer}> doit être placé dans un <Field> (components/ui/form).`);
  return value;
}
