import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const SERVER_IMPORT_MESSAGE =
  "Module serveur interdit dans un composant. Passer par une Server Action ou un Server Component.";

/*
 * Chemins fixes interdits (correspondance exacte via `paths`, pas de glob) : contrairement à
 * `patterns` (gitignore-style), `paths` ne matche jamais un sous-chemin. @/lib/db/schema (types
 * Drizzle uniquement, sans "server-only") doit rester importable en `import type` par un composant.
 */
const serverOnlyPaths = ["@/lib/db", "@/lib/env", "@/lib/uploads", "@/lib/mailer", "@/lib/public-image-upload"];

// Modules serveur interdits dans les composants (CLAUDE.md, section 4 : frontière serveur/client).
// Glob nécessaire ici pour le `*` (nom de feature variable).
const serverOnlyPatterns = [
  "@/features/*/auth-service",
  "@/features/*/user-repository",
  "@/features/*/session",
  "@/features/*/password",
  "@/features/*/auth-instance",
  "@/features/*/guards",
  "@/features/*/totp",
  "@/features/*/recovery-codes",
  "@/features/*/recovery-code-repository",
  "@/features/*/mfa-session",
  "@/features/*/mfa-verification",
  "@/features/*/mfa-actions",
  "@/features/*/mfa-enrollment-actions",
  "@/features/*/repository",
  "@/features/*/service",
  "@/features/*/contact-instance",
  "@/features/*/notifications-instance",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: serverOnlyPaths.map((name) => ({ name, message: SERVER_IMPORT_MESSAGE })),
          patterns: serverOnlyPatterns.map((group) => ({ group: [group], message: SERVER_IMPORT_MESSAGE })),
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: "Lire process.env uniquement via src/lib/env.ts (CLAUDE.md, section 4).",
        },
      ],
    },
  },
  {
    files: ["src/lib/env.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
