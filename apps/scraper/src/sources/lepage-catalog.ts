import { type CheerioAPI } from "cheerio";

import { findProduct, parseAvailability } from "../lib/jsonld.ts";
import { fetchSitemapPages } from "../lib/sitemap.ts";
import { parseMovement, parseWaterResistance } from "../lib/specs.ts";
import { cleanText, parseNumber, toCents } from "../lib/text.ts";
import { type OfficialAdapter } from "./types.ts";

/**
 * Catalogue d'une marque lu chez Lepage, détaillant agréé, quand son site refuse les robots
 * identifiés : rien n'y est contourné (docs/decisions.md, 1er novembre 2026). Le catalogue se
 * limite aux fiches neuves de Lepage, et son prix n'est jamais présenté comme un prix officiel.
 */
interface LepageBrand {
  brandSlug: string;
  /** Nom écrit par Lepage dans ses titres et ses collections. */
  brandName: string;
  /** Fiches de la marque à référence moderne. */
  productUrl: RegExp;
  /** Référence moderne : les pièces sans référence n'entrent pas au catalogue. */
  reference: RegExp;
  /** Écriture commune du calibre, quand Lepage la varie d'une fiche à l'autre. */
  caliber?: (value: string) => string | undefined;
}

/** Libellés de Lepage → libellés lus par la fiche technique. */
const LABELS: Record<string, string> = {
  Etanchéité: "Étanchéité",
  "Forme de boîte": "Forme du boitier",
  "Modèle du mouvement": "Calibre",
  Complications: "Fonctions du mouvement",
  Index: "Type d'index",
  Aiguilles: "Cadran · Aiguilles",
  "Couleur de cadran": "Couleur du cadran",
  "Matières du bracelet": "Matière du bracelet",
};

/** Informations propres à Lepage ou à la vente, sans valeur technique. */
const IGNORED = /^(?:Marque|Référence|Etat|Incontournable|Garantie\b.*)$/;

const rowValue = ($: CheerioAPI, label: string) =>
  cleanText(
    $("dt")
      .filter((_, dt) => cleanText($(dt).text()) === label)
      .first()
      .next("dd")
      .text(),
  );

function readSpecs($: CheerioAPI): Record<string, string> {
  const specs: Record<string, string> = {};
  $("dt").each((_, dt) => {
    const label = cleanText($(dt).text());
    // « Or jaune 750 ‰ anciennement nommé or jaune "18 carats" » : la matière seule.
    const value = cleanText($(dt).next("dd").text()).replace(/\s+anciennement nommée?.*$/i, "");
    if (!label || !value || IGNORED.test(label)) return;
    // Les onglets répètent les mêmes lignes : la première suffit.
    specs[LABELS[label] ?? label] ??= value;
  });
  return specs;
}

/**
 * Photos de la montre en grand format (2 200 px) : le JSON-LD ne donne que la vignette. Les
 * montres voisines affichées sur la page ont un autre nom de fichier et sont donc écartées.
 */
function readImages($: CheerioAPI, main: string[]): string[] {
  const file = main[0]?.split("/").at(-1);
  if (!file) return [];
  const first = /\/(\d+)-[a-z]+_default\//.exec(main[0]!)?.[1];
  const found = $.html().matchAll(/lepage\.fr\/(\d+)-[a-z]+_default\/([a-z0-9-]+\.[a-z]+)/g);
  const ids = [...found].filter((match) => match[2] === file).map((match) => match[1]!);
  const unique = [...new Set([first, ...ids])].filter(Boolean);
  return unique.map((id) => `https://www.lepage.fr/${id}-zoom_default/${file}`);
}

export function lepageCatalog(brand: LepageBrand): OfficialAdapter {
  const { brandName } = brand;

  function parse($: CheerioAPI, url: string) {
    const product = findProduct($);
    const reference = rowValue($, "Référence") || product?.mpn || product?.sku;
    if (!brand.productUrl.test(url) || !product || !reference) return null;
    if (!brand.reference.test(reference)) return null;
    // Une pièce d'occasion n'est pas une montre du catalogue actuel.
    if (rowValue($, "Etat") !== "Neuf") return null;

    // « Montre Tudor Black Bay automatique 41 mm M79230B-0008 - Lepage » → nom sans marque ni réf.
    const title = cleanText($("title").text());
    const end = title.toUpperCase().indexOf(reference.toUpperCase());
    const start = `Montre ${brandName} `.length;
    const name = end > start ? title.slice(start, end).trim() : undefined;
    const specs = readSpecs($);
    if (!name || !specs.Mouvement) return null;
    const { Collection: collection, Calibre: caliber } = specs;
    const signature = new RegExp(`^\\s*${brandName}\\s*-\\s*|\\s*-\\s*${brandName}\\s*$`, "gi");

    return {
      brandSlug: brand.brandSlug,
      url,
      reference: reference.toUpperCase(),
      name,
      // « Black Bay - Tudor », « Tudor - Black Bay 58 » ou « Black Bay - Tudor, Black Bay 36 ».
      collectionName: collection?.split(",").at(-1)?.replace(signature, "").trim(),
      imageUrls: readImages($, product.images),
      priceCents: product.priceCurrency === "EUR" ? toCents(product.price) : undefined,
      currency: "EUR" as const,
      availability: parseAvailability(product.availability),
      specs: {
        movement: parseMovement(specs.Mouvement),
        caliber: caliber && brand.caliber ? brand.caliber(caliber) : caliber,
        diameterMm: parseNumber(specs["Diamètre"]),
        waterResistanceM: parseWaterResistance(specs["Étanchéité"]),
        powerReserveH: parseNumber(/(\d+)\s*h/i.exec(specs["Réserve de marche"] ?? "")?.[1]),
        caseMaterial: specs["Matière de boite"],
        crystal: specs["Qualité du verre"],
        dialColor: specs["Couleur du cadran"],
        strapMaterial: specs["Matière du bracelet"],
      },
      rawSpecs: specs,
    };
  }

  return {
    kind: "official",
    // Pas de suffixe « -officiel » : le site affiche ce relevé comme celui du revendeur.
    id: `lepage-${brand.brandSlug}`,
    brandSlug: brand.brandSlug,
    async discover() {
      const pages = await fetchSitemapPages("https://www.lepage.fr/1_index_sitemap.xml", (url) =>
        /\/1_fr_\d+_sitemap\.xml$/.test(url),
      );
      return pages.filter((url) => brand.productUrl.test(url));
    },
    parse,
    partialCatalog: true,
    locales: {},
    localizeUrl: (url) => url,
  };
}
