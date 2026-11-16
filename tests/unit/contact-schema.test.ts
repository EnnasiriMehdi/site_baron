import { describe, expect, it } from "vitest";

import { contactSchema } from "@/features/contact/schema";

const valid = {
  name: "Marie Dupont",
  phone: "06 12 34 56 78",
  email: "marie@exemple.fr",
  subject: "Panne de chaudière",
  message: "La chaudière ne démarre plus depuis ce matin.",
};

describe("contactSchema", () => {
  it("accepte une demande valide", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("nettoie les espaces et met l'e-mail en minuscules", () => {
    const parsed = contactSchema.parse({ ...valid, name: "  Marie  ", email: "  Marie@Exemple.FR " });
    expect(parsed.name).toBe("Marie");
    expect(parsed.email).toBe("marie@exemple.fr");
  });

  it.each(["name", "phone", "email", "subject", "message"] as const)("refuse un champ « %s » vide", (field) => {
    expect(contactSchema.safeParse({ ...valid, [field]: "   " }).success).toBe(false);
  });

  it("refuse un e-mail invalide", () => {
    expect(contactSchema.safeParse({ ...valid, email: "pas-un-email" }).success).toBe(false);
  });

  it.each(["abcdefgh", "06 12 34 <script>", "123"])("refuse le téléphone « %s »", (phone) => {
    expect(contactSchema.safeParse({ ...valid, phone }).success).toBe(false);
  });

  it("accepte les formats de téléphone courants", () => {
    for (const phone of ["06 12 34 56 78", "+33 6 12 34 56 78", "(04) 93-00-00-00", "0612345678"]) {
      expect(contactSchema.safeParse({ ...valid, phone }).success, phone).toBe(true);
    }
  });

  it("applique les longueurs maximales", () => {
    expect(contactSchema.safeParse({ ...valid, name: "x".repeat(161) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, subject: "x".repeat(121) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(4001) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(4000) }).success).toBe(true);
  });
});
