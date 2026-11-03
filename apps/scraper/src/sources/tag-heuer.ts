import { lepageCatalog } from "./lepage-catalog.ts";

/** Les fiches de tagheuer.com répondent 403 à notre User-Agent : voir lepage-catalog.ts. */
export const tagHeuer = lepageCatalog({
  brandSlug: "tag-heuer",
  brandName: "TAG Heuer",
  // « full-set » et « ref- » désignent des pièces d'occasion.
  productUrl:
    /^https:\/\/www\.lepage\.fr\/fr\/\d+-montre-tag-heuer-(?![a-z0-9-]*(?:full-set|-ref-))[a-z0-9-]+\.html$/,
  // WBP1313.BA0005 : boîtier, puis bracelet.
  reference: /^[A-Z]{2,4}\d[0-9A-Z]{2,6}\.[A-Z]{2}\d{4}$/i,
  // « Calibre TH50-01 » → « TH50-01 » ; « Quartz Swiss Made » ne désigne aucun calibre.
  caliber: (value) => (/^quartz\b/i.test(value) ? undefined : value.replace(/^Calibre\s+/i, "")),
});

export const parseTagHeuer = tagHeuer.parse;
