"use server";

import { z } from "zod";

import { siteConfig } from "@/config/site";
import { clientIp } from "@/lib/client-ip";
import { RateLimiter } from "@/lib/rate-limit";
import { GLOBAL_ATTACHMENT_SUBMISSIONS, GLOBAL_ATTACHMENT_WINDOW_MS } from "@/lib/upload-limits";
import { storageHasRoomFor, validateAttachments } from "@/lib/uploads";

import { contactService } from "./contact-instance";
import { createFormToken, verifyFormToken } from "./form-token";
import { contactSchema } from "./schema";

export type ContactFormState =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string[] | undefined> }
  | null;

// 5 envois par IP sur 15 minutes : assez pour un visiteur réel, pas pour un script.
const contactRateLimiter = new RateLimiter(5, 15 * 60 * 1000);

// Plafond pour TOUT le site, quelle que soit l'IP : le limiteur ci-dessus se contourne en changeant
// d'adresse, pas celui-ci. Ne compte que les envois avec pièces jointes (les seuls qui coûtent du disque).
const globalAttachmentLimiter = new RateLimiter(GLOBAL_ATTACHMENT_SUBMISSIONS, GLOBAL_ATTACHMENT_WINDOW_MS);

function isFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && value.size > 0;
}

// Appelée par le formulaire à l'affichage (ContactForm) pour obtenir son jeton anti-robot.
export async function issueFormTokenAction(): Promise<string> {
  return createFormToken();
}

function attachmentsUnavailable(): ContactFormState {
  return {
    ok: false,
    error: `Les pièces jointes sont momentanément indisponibles. Renvoyez votre demande sans pièce jointe, ou appelez-nous au ${siteConfig.phone.display}.`,
  };
}

export async function submitContactAction(_previous: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const limit = contactRateLimiter.hit(await clientIp());
  if (!limit.allowed) {
    return { ok: false, error: "Trop de demandes envoyées. Réessayez dans quelques minutes, ou appelez-nous directement." };
  }

  // Honeypot : champ invisible pour un humain. Un bot qui le remplit reçoit un faux succès,
  // sans qu'aucune donnée ne soit enregistrée (CLAUDE.md, section 8.2).
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return { ok: true };
  }

  if (!(await verifyFormToken(formData.get("formToken")))) {
    return {
      ok: false,
      error: `Le formulaire a expiré ou n'est pas valide. Rechargez la page, ou appelez-nous au ${siteConfig.phone.display}.`,
    };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const files = formData.getAll("attachments").filter(isFile);
  const attachmentCheck = await validateAttachments(files);
  if (!attachmentCheck.ok) {
    return { ok: false, error: attachmentCheck.error };
  }

  if (files.length > 0) {
    if (!globalAttachmentLimiter.hit("global").allowed) return attachmentsUnavailable();
    const incomingBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (!(await storageHasRoomFor(incomingBytes))) return attachmentsUnavailable();
  }

  try {
    await contactService.submit(parsed.data, attachmentCheck.files);
  } catch (error) {
    // Sans ceci, une panne (base verrouillée, disque plein) affiche la page d'erreur par défaut de Next
    // et le visiteur ne sait pas si sa demande est partie. Nom de l'erreur seulement : aucune donnée
    // personnelle dans les logs (CLAUDE.md, section 8.4).
    console.error(
      `Échec de l'enregistrement d'une demande de contact (${error instanceof Error ? error.name : "erreur inconnue"}).`,
    );
    return {
      ok: false,
      error: `Votre demande n'a pas pu être enregistrée. Appelez-nous directement au ${siteConfig.phone.display}.`,
    };
  }

  return { ok: true };
}
