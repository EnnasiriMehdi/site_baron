"use client";

import { useActionState } from "react";

import { Field, Form, Input, SubmitButton } from "@/components/ui/form";

import { confirmMfaEmailResetAction, type MfaRecoveryState } from "../recovery-actions";

const initialState: MfaRecoveryState = null;

export function MfaEmailRecoveryForm() {
  const [state, formAction] = useActionState(confirmMfaEmailResetAction, initialState);

  return (
    <Form
      action={formAction}
      error={state?.error}
      actions={<SubmitButton pendingLabel="Vérification…">Valider et réinitialiser</SubmitButton>}
    >
      <Field name="code" label="Code reçu par e-mail">
        <Input
          type="text"
          autoComplete="one-time-code"
          autoFocus
          required
          spellCheck={false}
          className="text-center text-lg uppercase tracking-widest"
        />
      </Field>
    </Form>
  );
}
