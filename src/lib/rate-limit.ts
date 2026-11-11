/*
 * Limiteur de débit en mémoire, à fenêtre fixe.
 * Suffisant pour une instance unique (cf. CLAUDE.md, section 3 : une seule instance écrit dans la base).
 * Si plusieurs instances sont un jour nécessaires, remplacer l'implémentation par un stockage partagé
 * sans changer l'interface.
 */
export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

export class RateLimiter {
  private readonly hits = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  hit(key: string, now: number = Date.now()): RateLimitResult {
    this.prune(now);

    const entry = this.hits.get(key);
    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.hits.set(key, { count: 1, windowStart: now });
      return { allowed: true };
    }

    if (entry.count >= this.limit) {
      return { allowed: false, retryAfterMs: this.windowMs - (now - entry.windowStart) };
    }

    entry.count += 1;
    return { allowed: true };
  }

  // Évite que la mémoire grossisse indéfiniment avec des IP qui ne reviennent plus.
  private prune(now: number): void {
    if (this.hits.size < 1000) return;
    for (const [key, entry] of this.hits) {
      if (now - entry.windowStart >= this.windowMs) this.hits.delete(key);
    }
  }
}
