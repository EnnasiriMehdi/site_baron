"use server";

import { z } from "zod";

import { clientIp } from "@/lib/client-ip";
import { RateLimiter } from "@/lib/rate-limit";
import { validateAttachments } from "@/lib/uploads";

import { contactService } from "./contact-instance";
import { contactSchema } from "./schema";

export type ContactFormState =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string[] | undefined> }
  | null;

// 5 envois par IP sur 15 minutes : assez pour un visiteur réel, pas pour un script.
const contactRateLimiter = new RateLimiter(5, 15 * 60 * 1000);

function isFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && value.size > 0;
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
  const attachmentCheck = validateAttachments(files);
  if (!attachmentCheck.ok) {
    return { ok: false, error: attachmentCheck.error };
  }

  await contactService.submit(parsed.data, attachmentCheck.files);

  return { ok: true };
}
