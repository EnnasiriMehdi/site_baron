"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field, Form, Input, SubmitButton } from "@/components/ui/form";

import {
  confirmPasswordResetAction,
  requestPasswordResetAction,
  type PasswordResetConfirmState,
  type PasswordResetRequestState,
} from "../recovery-actions";

const initialRequestState: PasswordResetRequestState = null;
const initialConfirmState: PasswordResetConfirmState = null;

export function ForgotPasswordForm() {
  const [requestState, requestAction] = useActionState(requestPasswordResetAction, initialRequestState);
  const [confirmState, confirmAction] = useActionState(confirmPasswordResetAction, initialConfirmState);

  if (confirmState && "success" in confirmState) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-semibold text-(--color-primary)">Mot de passe modifié.</p>
        <Link href="/admin/login" className="underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  // Étape 2 : code reçu + nouveau mot de passe. Le message reste le même que l'adresse existe ou non.
  if (requestState && "step" in requestState) {
    return (
      <Form
        action={confirmAction}
        error={confirmState && "error" in confirmState ? confirmState.error : undefined}
        fieldErrors={confirmState && "fieldErrors" in confirmState ? confirmState.fieldErrors : undefined}
        actions={<SubmitButton pendingLabel="Enregistrement…">Changer le mot de passe</SubmitButton>}
      >
        <p className="text-sm text-(--color-text-muted)">
          Si un compte existe pour cette adresse, un code vient d&apos;y être envoyé (valable 15 minutes).
        </p>
        <input type="hidden" name="email" value={requestState.email} />

        <Field name="code" label="Code reçu par e-mail">
          <Input
            type="text"
            autoComplete="one-time-code"
            required
            spellCheck={false}
            className="text-center uppercase tracking-widest"
          />
        </Field>

        <Field name="newPassword" label="Nouveau mot de passe" hint="12 caractères minimum.">
          <Input type="password" autoComplete="new-password" required />
        </Field>

        <Field name="confirmPassword" label="Confirmer le mot de passe">
          <Input type="password" autoComplete="new-password" required />
        </Field>
      </Form>
    );
  }

  // Étape 1 : adresse e-mail du compte.
  return (
    <Form
      action={requestAction}
      error={requestState && "error" in requestState ? requestState.error : undefined}
      actions={<SubmitButton pendingLabel="Envoi…">Recevoir un code par e-mail</SubmitButton>}
    >
      <Field name="email" label="Adresse e-mail du compte">
        <Input type="email" autoComplete="username" inputMode="email" required spellCheck={false} />
      </Field>
    </Form>
  );
}
