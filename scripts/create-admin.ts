/*
 * Crée un compte administrateur depuis la ligne de commande : `npm run admin:create`.
 * Le mot de passe est saisi masqué et n'est jamais affiché, journalisé ni lu depuis une variable d'environnement.
 * Ce script n'est pas exposé sur le web.
 */
import readline from "node:readline/promises";

import { z } from "zod";

import { hashPassword } from "@/features/admin-auth/password";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

const MIN_PASSWORD_LENGTH = 12;

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(254),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`)
    .max(512),
});

async function askVisible(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

function askHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  const canMask = stdin.isTTY;
  process.stdout.write(question);
  if (canMask) stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\r" || char === "\n") {
          if (canMask) stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function main(): Promise<void> {
  const rawEmail = await askVisible("Adresse e-mail : ");
  const rawPassword = await askHidden("Mot de passe : ");

  const parsed = inputSchema.safeParse({ email: rawEmail, password: rawPassword });
  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => issue.message).join("\n- ");
    console.error(`Saisie invalide :\n- ${messages}`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    getDb()
      .insert(users)
      .values({ email: parsed.data.email, passwordHash, role: "admin" })
      .run();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      console.error("Un compte existe déjà avec cette adresse e-mail.");
      process.exit(1);
    }
    throw error;
  }

  console.log(`Administrateur créé : ${parsed.data.email}`);
}

main().catch((error: unknown) => {
  console.error("Échec de la création du compte.");
  if (error instanceof Error) console.error(error.message);
  process.exit(1);
});
