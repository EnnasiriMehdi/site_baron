/*
 * SEUL endroit où les polices du site sont déclarées. Trois rôles, pas davantage :
 *   --font-body     texte des pages visiteur
 *   --font-heading  titres des pages visiteur
 *   --font-admin    toute l'administration
 * L'application de ces rôles est faite dans app/globals.css : rien d'autre n'est à modifier pour changer de police.
 *
 * AUCUNE POLICE N'EST CONFIGURÉE pour l'instant : le site s'affiche en `serif` (police par défaut du navigateur),
 * volontairement, pour que cela se voie. Chaque rôle est indépendant.
 *
 * Pour configurer : déposer les fichiers dans ce dossier (.woff2 de préférence, .otf accepté), déclarer chaque police
 * avec next/font/local, puis ajouter sa classe de variable à `fontVariables`. Exemple :
 *
 *   import localFont from "next/font/local";
 *
 *   const bodyFont = localFont({
 *     src: [
 *       { path: "./corps-regular.woff2", weight: "400" },
 *       { path: "./corps-bold.woff2", weight: "700" },
 *     ],
 *     variable: "--font-body",
 *     display: "swap",
 *   });
 *
 *   export const fontVariables = [bodyFont.variable].join(" ");
 */

// Classes CSS qui définissent les variables de police, posées sur <html> (app/layout.tsx).
export const fontVariables = "";
