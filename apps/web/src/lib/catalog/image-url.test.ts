import { describe, expect, it } from "vitest";

import { sizedImage } from "@/lib/catalog/image-url";

describe("sizedImage", () => {
  it("demande la largeur voulue à Omega, en remplaçant un paramètre existant", () => {
    const omega = "https://www.omegawatches.com/media/catalog/product/o/m/a.png?w=230";
    expect(sizedImage(omega, 480)).toBe(
      "https://www.omegawatches.com/media/catalog/product/o/m/a.png?w=480",
    );
  });

  it("cale Longines sur ses tailles rapides, et garde l'original pour le zoom", () => {
    const longines = "https://api.ecom.longines.com/media/catalog/product/a.jpg";
    expect(sizedImage(longines, 200)).toBe(`${longines}?w=256`);
    expect(sizedImage(longines, 800)).toBe(`${longines}?w=828`);
    expect(sizedImage(longines, 2000)).toBe(longines);
  });

  it("cale Seiko sur ses tailles publiées", () => {
    const seiko = "https://www.seikowatches.com/fr-fr/-/media/Images/a.png";
    expect(sizedImage(`${seiko}?mh=1200&mw=1200`, 200)).toBe(`${seiko}?mh=300&mw=300`);
    expect(sizedImage(`${seiko}?mh=1200&mw=1200`, 800)).toBe(`${seiko}?mh=1200&mw=1200`);
  });

  it("traite Grand Seiko comme Seiko, même sans paramètre d'origine", () => {
    const image = "https://www.grand-seiko.com/fr-fr/-/media/Images/a.png";
    expect(sizedImage(image, 450)).toBe(`${image}?mh=300&mw=300`);
  });

  it("passe par le service de redimensionnement de Tissot, sauf pour le zoom", () => {
    const tissot = "https://www.tissotwatches.com/on/demandware.static/-/Sites/a.png";
    expect(sizedImage(tissot, 240)).toBe(
      "https://www.tissotwatches.com/dw/image/v2/BKKD_PRD/on/demandware.static/-/Sites/a.png?sm=fit&sw=300&sh=300",
    );
    expect(sizedImage(tissot, 2000)).toBe(tissot);
  });

  it("choisit le format Lepage suffisant, et garde le grand format au-delà", () => {
    const lepage = "https://www.lepage.fr/36973-zoom_default/montre.jpg";
    expect(sizedImage(lepage, 200)).toContain("-home_default/");
    expect(sizedImage(lepage, 800)).toContain("-large_default/");
    expect(sizedImage(lepage, 2000)).toBe(lepage);
  });

  it("laisse intacte une adresse sans règle connue", () => {
    const other = "https://www.hamiltonwatch.com/media/a.png?x=1";
    expect(sizedImage(other, 200)).toBe(other);
  });
});
