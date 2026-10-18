import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
  it("échappe < pour empêcher la fermeture de la balise script", () => {
    const name = "</script><script>alert(1)</script>";
    const out = serializeJsonLd({ "@context": "https://schema.org", "@type": "Thing", name });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe(name);
  });
});
