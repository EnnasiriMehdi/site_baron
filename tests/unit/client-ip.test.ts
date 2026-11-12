import { describe, expect, it } from "vitest";

import { pickClientIp } from "@/lib/client-ip";

describe("pickClientIp", () => {
  it("prend la valeur unique posée par le proxy", () => {
    expect(pickClientIp("203.0.113.7")).toBe("203.0.113.7");
  });

  it("prend la DERNIÈRE valeur : la première est forgeable par le visiteur", () => {
    // Le visiteur envoie "1.2.3.4" ; le proxy ajoute l'IP qu'il a réellement vue.
    expect(pickClientIp("1.2.3.4, 203.0.113.7")).toBe("203.0.113.7");
  });

  it("ne change pas de clé quand l'attaquant change sa fausse IP", () => {
    expect(pickClientIp("9.9.9.9, 203.0.113.7")).toBe(pickClientIp("8.8.8.8, 203.0.113.7"));
  });

  it("accepte une adresse IPv6", () => {
    expect(pickClientIp("2001:db8::1")).toBe("2001:db8::1");
  });

  it("renvoie 'unknown' sans en-tête", () => {
    expect(pickClientIp(null)).toBe("unknown");
  });

  it("refuse une valeur qui n'est pas une adresse IP", () => {
    expect(pickClientIp("pas-une-ip")).toBe("unknown");
    expect(pickClientIp("x".repeat(5000))).toBe("unknown");
  });
});
