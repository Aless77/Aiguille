import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { listingSchema } from "../lib/listing";
import { omega, parseCatalogLinks, parseCatalogPage, parseOmega, translateOmega } from "./omega";

const html = readFileSync(
  new URL("./__fixtures__/omega-planet-ocean.html", import.meta.url),
  "utf8",
);
const german = readFileSync(
  new URL("./__fixtures__/omega-planet-ocean-de.html", import.meta.url),
  "utf8",
);
const url =
  "https://www.omegawatches.com/fr-fr/watch-omega-seamaster-planet-ocean-600m-co-axial-master-chronometer-42-mm-21730422101002";

describe("Omega officiel", () => {
  it("lit la fiche : données techniques par code et offre principale", () => {
    const parsed = listingSchema.parse(parseOmega(load(html), url));
    expect(parsed).toMatchObject({
      brandSlug: "omega",
      reference: "217.30.42.21.01.002",
      name: "Seamaster Planet Ocean 600M 42 mm, acier sur acier",
      collectionName: "Planet Ocean 600M",
      priceCents: 900000,
      availability: "in_stock",
      specs: {
        movement: "automatique",
        caliber: "Omega 8912",
        diameterMm: 42,
        thicknessMm: 13.79,
        lugWidthMm: 21,
        waterResistanceM: 600,
        powerReserveH: 60,
        caseMaterial: "Acier",
      },
    });
    expect(parsed.imageUrls[0]).not.toContain("?w=");
    expect(parsed.rawSpecs).toMatchObject({ "Numéro du calibre": "Omega 8912", Poids: "177 g" });
  });

  it("ajoute la fréquence et les fonctions publiées hors du tableau", () => {
    const page = html.replace(
      "</body>",
      `<ul><li class="ow-mod_37__picto ow-mod_37__picto--frequency"><span>Fréquence 3,5 Hz</span></li></ul>
       <button class="tooltip toggle ow-tags">Fonction fuseau horaire</button>
       <button class="tooltip toggle ow-tags">Certification Master Chronometer</button></body>`,
    );
    expect(parseOmega(load(page), url)?.rawSpecs).toMatchObject({
      Fréquence: "3,5 Hz",
      "Fonctions du mouvement": "Fonction fuseau horaire, Certification Master Chronometer",
    });
  });

  it("ignore une page sans calibre et une adresse d'accessoire", () => {
    expect(parseOmega(load("<html><body></body></html>"), url)).toBeNull();
    const strap = "https://www.omegawatches.com/fr-fr/accessories/bracelets-straps/watch-straps";
    expect(parseOmega(load(html), strap)).toBeNull();
  });

  it("garde les libellés de rawSpecs dans la version française, pivot des traductions", () => {
    const parsed = parseOmega(load(html), url)!;
    const french = translateOmega(load(html), url)!;
    expect(Object.values(french.specs).map((s) => s.label)).toEqual(Object.keys(parsed.rawSpecs));
  });

  it("range la version allemande sous les mêmes codes, avec ses libellés", () => {
    const germanUrl = omega.localizeUrl(url, "de-de");
    expect(germanUrl).toContain("/de-de/watch-omega-");
    const translated = translateOmega(load(german), germanUrl)!;
    const french = translateOmega(load(html), url)!;
    expect(Object.keys(translated.specs).sort()).toEqual(Object.keys(french.specs).sort());
    expect(translated.specs.watch_dial?.value).toBe("Schwarz");
    expect(translated.specs.watch_dial?.label).not.toBe("Couleur du cadran");
  });

  it("lit les liens du menu et les fiches d'une page catalogue", () => {
    const menu = `<a href="https://www.omegawatches.com/fr-fr/watches/seamaster/planet-ocean/catalog">x</a>
      <a href="https://www.omegawatches.com/fr-fr/accessories/bracelets-straps/watch-straps/catalog">y</a>`;
    expect(parseCatalogLinks(menu)).toEqual([
      "https://www.omegawatches.com/fr-fr/watches/seamaster/planet-ocean/catalog",
    ]);
    const page = `{"page_info":{"current_page":1,"page_size":24,"total_pages":5},
      "url_key":"watch-omega-a-1","url_key":"watch-omega-a-1","url_key":"strap-omega-b"}`;
    expect(parseCatalogPage(page)).toEqual({
      urls: ["https://www.omegawatches.com/fr-fr/watch-omega-a-1"],
      totalPages: 5,
    });
  });
});
