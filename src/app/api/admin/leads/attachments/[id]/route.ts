import { readFile } from "node:fs/promises";

import { getAuthenticatedAdmin } from "@/features/admin-auth";
import { drizzleLeadRepository } from "@/features/leads";
import { EXTENSION_BY_IMAGE_TYPE, safeDownloadName } from "@/lib/image-type";
import { resolveUploadPath } from "@/lib/uploads";

/*
 * Sert une pièce jointe à l'admin connecté uniquement, dans deux modes :
 * - aperçu (par défaut) : Content-Type de l'image (image/jpeg, image/png, image/webp), affichable
 *   inline pour le carrousel. Sûr parce que le type vient de la détection par les octets faite à
 *   l'envoi (lib/uploads.ts), jamais du nom de fichier ni d'une valeur arbitraire, combiné à
 *   `nosniff` (le navigateur ne devine pas un autre type) et à une CSP `sandbox` (aucun script).
 * - téléchargement forcé (`?download=1`) : Content-Type générique + Content-Disposition: attachment.
 * Dans les deux cas le nom proposé est nettoyé et son extension imposée par le type vérifié :
 * jamais l'extension choisie par le visiteur (lib/image-type.ts, safeDownloadName).
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

  // Tout type hors des images connues (anciennes données) est servi en téléchargement seul.
  const isKnownImage = attachment.mimeType in EXTENSION_BY_IMAGE_TYPE;
  const asDownload = new URL(request.url).searchParams.get("download") === "1" || !isKnownImage;
  const downloadName = safeDownloadName(attachment.originalName, attachment.mimeType);

  try {
    const data = await readFile(resolveUploadPath(attachment.storedPath));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": asDownload ? "application/octet-stream" : attachment.mimeType,
        "Content-Disposition": `${asDownload ? "attachment" : "inline"}; filename="${downloadName}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Fichier introuvable", { status: 404 });
  }
}
