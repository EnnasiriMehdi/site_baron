"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/admin-auth";

import { drizzleLeadRepository } from "./repository";

const setDoneSchema = z.object({
  leadId: z.coerce.number().int().positive(),
  done: z.enum(["true", "false"]),
});

// Marque une demande comme traitée (ou la rouvre). Session revérifiée ici : le middleware ne suffit pas (CLAUDE.md §8.1).
export async function setLeadDoneAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = setDoneSchema.safeParse({ leadId: formData.get("leadId"), done: formData.get("done") });
  if (!parsed.success) return;

  await drizzleLeadRepository.setDone(parsed.data.leadId, parsed.data.done === "true");

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  revalidatePath("/admin");
}
