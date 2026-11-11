import "server-only";

import { headers } from "next/headers";

// Ne fait confiance à X-Forwarded-For que parce que le reverse proxy (Caddy/Nginx) réécrit cet en-tête.
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
