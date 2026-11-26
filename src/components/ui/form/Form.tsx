"use client";

import { useEffect, useMemo, useRef, type ComponentProps, type ReactNode } from "react";

import { FormContext } from "./form-context";
import { NO_FIELD_ERRORS, hasAnyError, type FieldErrors } from "./form-logic";

type FormProps = {
  action: ComponentProps<"form">["action"];
  // Erreur globale du serveur (identifiants invalides, trop de tentatives…).
  error?: string;
  // Erreurs par champ : chaque <Field> affiche celle qui porte son `name`.
  fieldErrors?: FieldErrors;
  // Si renseigné, remplace le formulaire (succès affiché dans le corps de la page : contact, mot de passe…).
  // Pour une redirection ou un toast, ne pas l'utiliser : le composant de la feature réagit au résultat.
  success?: ReactNode;
  // Boutons d'envoi : placés SOUS la zone d'erreur globale.
  actions?: ReactNode;
  // S'ajoute au style de base (mise en page). Un formulaire très différent recrée son propre <Form> dans sa feature.
  className?: string;
  children: ReactNode;
};

/*
 * Enveloppe `<form action>` : zone d'erreur globale (toujours présente, `role="alert"`, sans décalage de mise en page),
 * erreurs de champ fournies aux <Field>, focus sur le premier champ invalide après un envoi refusé.
 * Une erreur dont la clé ne correspond à aucun <Field name="…"> n'affiche rien (le serveur peut légitimement citer
 * un champ caché, comme un jeton expiré) : vérifier les `name` en testant le cas d'erreur à la main.
 */
export function Form({ action, error, fieldErrors = NO_FIELD_ERRORS, success, actions, className, children }: FormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const context = useMemo(() => ({ fieldErrors }), [fieldErrors]);

  // `fieldErrors` est un objet nouveau à chaque réponse du serveur : le focus se rejoue à chaque envoi refusé.
  useEffect(() => {
    if (!hasAnyError(fieldErrors)) return;
    // Ordre du DOM = ordre visuel : on tombe sur le premier champ invalide.
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fieldErrors]);

  if (success) return <>{success}</>;

  return (
    <FormContext.Provider value={context}>
      <form ref={formRef} action={action} className={`flex flex-col gap-4${className ? ` ${className}` : ""}`}>
        {children}
        <div role="alert" aria-live="assertive" className="min-h-6">
          {error && <p className="text-sm text-(--color-danger)">{error}</p>}
        </div>
        {actions}
      </form>
    </FormContext.Provider>
  );
}
