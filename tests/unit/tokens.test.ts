import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Vérifie que les paires texte/fond des tokens respectent WCAG AA (4,5:1 pour le texte normal).
const css = fs.readFileSync(path.resolve(__dirname, "../../src/styles/tokens.css"), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Bloc introuvable : ${selector}`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const tokens: Record<string, string> = {};
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const pairs: Array<[string, string]> = [
  ["color-text", "color-surface"],
  ["color-text-muted", "color-surface"],
  ["color-text-muted", "color-surface-muted"],
  ["color-primary-contrast", "color-primary"],
  ["color-accent-contrast", "color-accent"],
  ["color-danger", "color-surface"],
];

// Icônes sur pastille teintée : éléments graphiques, pas du texte. Le minimum WCAG non-texte est 3:1.
const nonTextPairs: Array<[string, string]> = [
  ["color-primary", "color-primary-soft"],
  ["color-accent", "color-accent-soft"],
];

describe("tokens de couleur", () => {
  const themes = {
    clair: block(":root {"),
    sombre: block(':root[data-theme="dark"]'),
  };

  for (const [name, tokens] of Object.entries(themes)) {
    it.each(pairs)(`thème ${name} : %s sur %s respecte 4,5:1`, (text, background) => {
      expect(contrast(tokens[text], tokens[background])).toBeGreaterThanOrEqual(4.5);
    });

    it.each(nonTextPairs)(`thème ${name} : %s sur %s respecte 3:1 (icône)`, (foreground, background) => {
      expect(contrast(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(3);
    });
  }
});
