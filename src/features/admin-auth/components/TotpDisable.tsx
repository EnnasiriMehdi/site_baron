"use client";

import { useActionState } from "react";

import { Field, Form, Input, SubmitButton } from "@/components/ui/form";

import { disableTotpAction, type DisableMfaState } from "../mfa-enrollment-actions";

const initialState: DisableMfaState = null;

export function TotpDisable() {
  const [state, formAction] = useActionState(disableTotpAction, initialState);

  return (
    <Form
      action={formAction}
      error={state && "error" in state ? state.error : undefined}
      success={
        state && "success" in state ? (
          <p className="text-(--color-text-muted)">
            Ancien téléphone déconnecté. Rechargez la page pour configurer le nouveau.
          </p>
        ) : undefined
      }
      actions={
        <SubmitButton variant="danger" pendingLabel="Vérification…" className="self-start">
          Changer de téléphone
        </SubmitButton>
      }
    >
      <p className="text-(--color-text-muted)">
        La double authentification est active (elle est obligatoire). Pour changer de téléphone,
        confirmez avec un code de votre application ou un code de secours : vous configurerez ensuite le
        nouvel appareil.
      </p>
      <Field name="code" label="Code de confirmation">
        <Input type="text" autoComplete="one-time-code" required className="max-w-xs text-center tracking-widest" />
      </Field>
    </Form>
  );
}
