import { describe, expect, it } from "vitest";

import { translateWatch, type WatchTranslationData } from "./translations";

const watch = {
  name: "Conquest 41 mm",
  rawSpecs: { "Cadran · Couleur": "Bleu soleillé", Garantie: "Garantie Longines de 5 ans" },
  dialColor: "Bleu soleillé",
  caseMaterial: "Acier",
  strapMaterial: "Acier",
  crystal: "Saphir",
};

const version = (
  name: string,
  label: string,
  value: string,
  fields: WatchTranslationData["fields"] = {},
): WatchTranslationData => ({ name, specs: { dial_color: { label, value } }, fields });

const fr = version("Conquest 41 mm", "Cadran · Couleur", "Bleu soleillé");
const en = version("Conquest 41 mm", "Dial · Colour", "Sunray blue", { dialColor: "Sunray blue" });
const de = version("Conquest 41 mm", "Zifferblatt · Farbe", "Sonnenschliff blau", {
  dialColor: "Sonnenschliff blau",
});

describe("translateWatch", () => {
  it("garde la fiche française telle quelle", () => {
    expect(translateWatch(watch, "fr", { fr, en })).toEqual({
      watch,
      status: "native",
      labels: {},
    });
  });

  it("applique la version de la langue par clé stable, sous les libellés français", () => {
    const t = translateWatch(watch, "de", { fr, en, de });
    expect(t.status).toBe("native");
    expect(t.watch.rawSpecs["Cadran · Couleur"]).toBe("Sonnenschliff blau");
    expect(t.watch.dialColor).toBe("Sonnenschliff blau");
    expect(t.labels["Cadran · Couleur"]).toBe("Zifferblatt · Farbe");
    // Valeur sans clé (lue ailleurs sur la page) : inchangée.
    expect(t.watch.rawSpecs.Garantie).toBe("Garantie Longines de 5 ans");
    expect(t.watch.caseMaterial).toBe("Acier");
  });

  it("se replie sur l'anglais, puis sur le français", () => {
    expect(translateWatch(watch, "it", { fr, en }).status).toBe("english");
    expect(translateWatch(watch, "it", { fr, en }).watch.dialColor).toBe("Sunray blue");
    expect(translateWatch(watch, "it", { fr }).status).toBe("source");
    expect(translateWatch(watch, "en", {}).watch).toBe(watch);
  });
});
