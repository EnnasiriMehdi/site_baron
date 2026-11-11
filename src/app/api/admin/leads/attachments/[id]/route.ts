import { readFile } from "node:fs/promises";

import { getAuthenticatedAdmin } from "@/features/admin-auth";
import { drizzleLeadRepository } from "@/features/leads";
import { resolveUploadPath } from "@/lib/uploads";

/*
 * Sert une pièce jointe à l'admin connecté uniquement, dans deux modes :
 * - aperçu (par défaut) : Content-Type réel (image/jpeg, application/pdf...), affichable inline
 *   pour le carrousel. Sûr uniquement parce que le type vient de l'allowlist validée à l'envoi
 *   (lib/uploads.ts), jamais du nom de fichier ni d'une valeur arbitraire, combiné à `nosniff`
 *   qui empêche le navigateur de deviner un autre type à partir du contenu.
 * - téléchargement forcé (`?download=1`) : Content-Type générique + Content-Disposition: attachment,
 *   dans tous les cas, en secours.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return new Response("Non autorisé", { status: 401 });
  }

  const { id } = await params;
  const attachmentId = Number(id);
  if (!Number.isInteger(attachmentId)) {
    return new Response("Introuvable", { status: 404 });
  }

  const attachment = await drizzleLeadRepository.findAttachmentById(attachmentId);
  if (!attachment) {
    return new Response("Introuvable", { status: 404 });
  }

  const forceDownload = new URL(request.url).searchParams.get("download") === "1";
  const safeName = attachment.originalName.replace(/[\r\n"]/g, "_");

  try {
    const data = await readFile(resolveUploadPath(attachment.storedPath));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": forceDownload ? "application/octet-stream" : attachment.mimeType,
        "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${safeName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Fichier introuvable", { status: 404 });
  }
}
