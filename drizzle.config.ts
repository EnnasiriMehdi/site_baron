import { defineConfig } from "drizzle-kit";

// Configuration d'outillage uniquement : le chemin de la base n'est pas un secret.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dbCredentials: {
    url: `data/${process.env.DATABASE_FILENAME ?? "site.db"}`,
  },
});
