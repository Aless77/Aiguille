import { lepageCatalog } from "./lepage-catalog.ts";

/** tudorwatch.com répond 403 à notre User-Agent, sitemap compris : voir lepage-catalog.ts. */
export const tudor = lepageCatalog({
  brandSlug: "tudor",
  brandName: "Tudor",
  productUrl:
    /^https:\/\/www\.lepage\.fr\/fr\/\d+-montre-tudor-[a-z0-9-]+-m\d{5}[a-z]*-\d{4}\.html$/,
  reference: /^M\d{5}[A-Z]*-\d{4}$/i,
  // « Calibre MT5813 - Tudor » et « Tudor MT5602-1U » → même écriture.
  caliber: (value) => {
    const manufacture = /\bMT\d{4}(?:-\w+)?/.exec(value)?.[0];
    return manufacture ? `Tudor ${manufacture}` : value;
  },
});

export const parseTudor = tudor.parse;
