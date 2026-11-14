import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "@/lib/json-ld";

describe("serializeJsonLd", () => {
  it("ne laisse aucun '<' dans la sortie, donc aucune fermeture possible de la balise script", () => {
    const out = serializeJsonLd({ headline: "Astuce</script><script>alert(1)</script>" });

    expect(out).not.toContain("<");
    expect(out.toLowerCase()).not.toContain("</script");
  });

  it("reste un JSON valide qui redonne exactement la valeur d'origine", () => {
    const data = { headline: "Astuce</script><script>alert(1)</script>", n: 3 };

    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("ne modifie pas un contenu ordinaire", () => {
    expect(serializeJsonLd({ name: "Nova" })).toBe('{"name":"Nova"}');
  });
});
