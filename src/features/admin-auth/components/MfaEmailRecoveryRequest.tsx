"use client";

import { useActionState } from "react";

import { Form, SubmitButton } from "@/components/ui/form";

import { requestMfaEmailResetAction, type MfaRecoveryState } from "../recovery-actions";

const initialState: MfaRecoveryState = null;

// Sous le formulaire de code 2FA : "téléphone perdu" → envoie un code à l'e-mail du compte.
export function MfaEmailRecoveryRequest() {
  const [state, formAction] = useActionState(async () => requestMfaEmailResetAction(), initialState);

  return (
    <Form
      action={formAction}
      error={state?.error}
      className="mt-6 border-t border-(--color-border) pt-4"
      actions={
        <SubmitButton variant="outline" pendingLabel="Envoi…" className="self-start">
          Recevoir un code par e-mail
        </SubmitButton>
      }
    >
      <p className="text-sm text-(--color-text-muted)">
        Plus accès à votre application d&apos;authentification ? Recevez un code par e-mail pour
        réinitialiser la double authentification.
      </p>
    </Form>
  );
}
