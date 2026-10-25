import { describe, expect, it } from "vitest";

import { BRAND_INFO, CARE_TIPS, servicePricesFor } from "./brand-info";
import { COMPLICATIONS } from "./facts";
import { localize, localizeAdvantage, LOCALES, PHRASES, TEXTS } from "./i18n";
import { buildSpecSheet } from "./spec-sheet";

/** Tous les textes de brand-info.ts affichés sur le site. */
function brandTexts(): string[] {
  const texts: string[] = [];
  for (const info of Object.values(BRAND_INFO)) {
    const w = info.warranty?.value;
    const s = info.service?.value;
    texts.push(...(w?.extended.map((e) => e.when) ?? []), ...(w?.excludes ?? []));
    if (s) {
      const fields = [
        s.priceNote,
        s.batteryNote,
        s.fullServiceInterval,
        s.partialServiceInterval,
        s.waterResistanceCheck,
        s.batteryLife,
        s.spareParts,
      ];
      texts.push(...fields.filter((x): x is string => Boolean(x)), ...s.free);
    }
    if (info.madeIn) texts.push(info.madeIn.value);
    texts.push(...info.movementMakers.map((m) => m.value));
  }
  return texts;
}

describe("traductions des textes de packages/db", () => {
  it("traduit chaque texte de marque, conseil et complication dans toutes les langues", () => {
    const vintageNote = servicePricesFor("tissot", "quartz", false, { vintage: true })?.priceNote;
    const all = [
      ...brandTexts(),
      ...Object.values(CARE_TIPS),
      ...Object.values(COMPLICATIONS),
      vintageNote!,
    ];
    const missing = all.filter((text) => !TEXTS[text]);
    expect(missing).toEqual([]);
    for (const text of all) {
      for (const locale of LOCALES.filter((l) => l !== "fr")) {
        expect(TEXTS[text]![locale], `${text} (${locale})`).toBeTruthy();
      }
    }
  });

  it("garde le français et se replie sur le texte source", () => {
    expect(localize("Céramique", "fr")).toBe("Céramique");
    expect(localize("Céramique", "de")).toBe("Keramik");
    expect(localize("Texte inconnu", "en")).toBe("Texte inconnu");
  });

  it("traduit les avantages de comparaison enregistrés en français", () => {
    expect(localizeAdvantage("Verre saphir", "en")).toBe("Sapphire crystal");
    expect(localizeAdvantage("80 h de réserve de marche au lieu de 38 h", "de")).toBe(
      "80 h Gangreserve statt 38 h",
    );
    expect(localizeAdvantage("Chronographe, Phases de lune", "it")).toBe("Cronografo, Fasi lunari");
    expect(localizeAdvantage("Garantie de 5 ans", "es")).toBe("Garantía de 5 años");
    expect(Object.keys(PHRASES)).toEqual([...LOCALES]);
  });

  it("produit la fiche technique dans la langue demandée", () => {
    const sheet = buildSpecSheet(
      {
        brandSlug: "longines",
        name: "Conquest",
        collectionName: null,
        movement: "automatique",
        caliber: "L888.5",
        diameterMm: 41,
        waterResistanceM: 100,
        powerReserveH: 72,
        caseMaterial: "Acier",
        crystal: "Saphir",
        rawSpecs: {},
        thicknessMm: 11.5,
        lugWidthMm: 21,
        dialColor: "Bleu",
        strapMaterial: "Acier",
        storeCount: 1200,
      },
      "en",
    );
    const value = (group: string, label: string) =>
      sheet.groups.find((g) => g.id === group)?.rows.find((r) => r.label === label)?.value;
    expect(value("mouvement", "Type")).toBe("Automatic mechanical");
    expect(value("mouvement", "Réserve de marche")).toBe("72 hours");
    expect(value("boitier", "Épaisseur")).toBe("11.5 mm");
    expect(value("garantie", "Garantie internationale")).toBe("5 years");
    expect(value("garantie", "Contrôle d'étanchéité conseillé")).toBe("Once a year");
    expect(value("garantie", "Points de vente agréés en Europe")).toBe("1,200 listed");
    expect(sheet.care[0]?.text).toMatch(/crown/);
  });
});
