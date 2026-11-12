import { describe, expect, it } from "vitest";

import { COMPRESSION_MAX_SIDE, computeTargetSize } from "@/features/contact/image-compression";

/*
 * Seul le calcul des dimensions est testable ici (pas de navigateur). La compression elle-même, qui
 * passe par le canvas, se vérifie à la main : voir claude_perso/test.md.
 */
describe("computeTargetSize", () => {
  it("réduit une photo de téléphone en gardant les proportions", () => {
    // 4000 x 3000 (12 Mpx) -> 2560 x 1920
    expect(computeTargetSize(4000, 3000)).toEqual({ width: 2560, height: 1920 });
  });

  it("réduit aussi une photo en portrait", () => {
    expect(computeTargetSize(3000, 4000)).toEqual({ width: 1920, height: 2560 });
  });

  it("n'agrandit jamais une petite image", () => {
    expect(computeTargetSize(800, 600)).toEqual({ width: 800, height: 600 });
    expect(computeTargetSize(COMPRESSION_MAX_SIDE, 100)).toEqual({ width: COMPRESSION_MAX_SIDE, height: 100 });
  });

  it("accepte une limite personnalisée", () => {
    expect(computeTargetSize(2000, 1000, 1000)).toEqual({ width: 1000, height: 500 });
  });

  it("garde des dimensions entières", () => {
    const { width, height } = computeTargetSize(4001, 3001);
    expect(Number.isInteger(width)).toBe(true);
    expect(Number.isInteger(height)).toBe(true);
    expect(Math.max(width, height)).toBe(COMPRESSION_MAX_SIDE);
  });
});
