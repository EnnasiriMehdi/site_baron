"use client";

import { useActionState } from "react";

import { Field, Form, Input, SubmitButton } from "@/components/ui/form";

import { changePasswordAction, type ChangePasswordState } from "../password-actions";

const initialState: ChangePasswordState = null;

export function ChangePassword() {
  const [state, formAction] = useActionState(changePasswordAction, initialState);

  return (
    <Form
      action={formAction}
      className="max-w-sm"
      error={state && "error" in state ? state.error : undefined}
      fieldErrors={state && "fieldErrors" in state ? state.fieldErrors : undefined}
      success={
        state && "success" in state ? <p className="text-(--color-text-muted)">Mot de passe mis à jour.</p> : undefined
      }
      actions={
        <SubmitButton pendingLabel="Enregistrement…" className="self-start">
          Changer le mot de passe
        </SubmitButton>
      }
    >
      <Field name="currentPassword" label="Mot de passe actuel">
        <Input type="password" autoComplete="current-password" required />
      </Field>

      <Field name="newPassword" label="Nouveau mot de passe" hint="12 caractères minimum.">
        <Input type="password" autoComplete="new-password" required minLength={12} />
      </Field>

      <Field name="confirmPassword" label="Confirmer le nouveau mot de passe">
        <Input type="password" autoComplete="new-password" required />
      </Field>
    </Form>
  );
}
