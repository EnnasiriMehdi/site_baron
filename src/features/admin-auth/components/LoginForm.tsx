"use client";

import { useActionState } from "react";

import { Field, Form, Input, SubmitButton } from "@/components/ui/form";

import { loginAction, type LoginFormState } from "../actions";

const initialState: LoginFormState = null;

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <Form
      action={formAction}
      error={state?.error}
      fieldErrors={state?.fieldErrors}
      actions={<SubmitButton pendingLabel="Connexion en cours…">Se connecter</SubmitButton>}
    >
      <Field name="email" label="Adresse e-mail">
        <Input type="email" autoComplete="username" inputMode="email" required spellCheck={false} />
      </Field>

      <Field name="password" label="Mot de passe">
        <Input type="password" autoComplete="current-password" required />
      </Field>
    </Form>
  );
}
