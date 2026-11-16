import { describe, expect, it } from "vitest";

import { RateLimiter } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  it("autorise jusqu'à la limite puis bloque", () => {
    const limiter = new RateLimiter(3, 1000);
    expect(limiter.hit("ip", 0)).toEqual({ allowed: true });
    expect(limiter.hit("ip", 1)).toEqual({ allowed: true });
    expect(limiter.hit("ip", 2)).toEqual({ allowed: true });
    expect(limiter.hit("ip", 3)).toEqual({ allowed: false, retryAfterMs: 997 });
  });

  it("réinitialise la fenêtre après expiration", () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.hit("ip", 0);
    expect(limiter.hit("ip", 500).allowed).toBe(false);
    expect(limiter.hit("ip", 1000).allowed).toBe(true);
  });

  it("isole les clés entre elles", () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.hit("a", 0);
    expect(limiter.hit("b", 0).allowed).toBe(true);
  });

  it("reset remet à zéro une seule clé", () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.hit("a", 0);
    limiter.hit("b", 0);

    limiter.reset("a");

    expect(limiter.hit("a", 1).allowed).toBe(true);
    expect(limiter.hit("b", 1).allowed).toBe(false);
  });
});
