"use client";

import { useActionState } from "react";

import { Field, Form, Input, SubmitButton } from "@/components/ui/form";

import { verifyMfaAction, type MfaFormState } from "../mfa-actions";

const initialState: MfaFormState = null;

export function MfaForm() {
  const [state, formAction] = useActionState(verifyMfaAction, initialState);

  return (
    <Form
      action={formAction}
      error={state?.error}
      actions={<SubmitButton pendingLabel="Vérification…">Valider</SubmitButton>}
    >
      <Field
        name="code"
        label="Code de l'application d'authentification"
        hint="Ou un de vos codes de secours au format XXXXX-XXXXX."
      >
        <Input
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          autoFocus
          required
          className="text-center text-lg tracking-widest"
        />
      </Field>
    </Form>
  );
}
