import { type CheerioAPI } from "cheerio";

import { type Listing } from "../lib/listing.ts";

/**
 * Un adaptateur par source (cahier des charges, section Risques) : découvrir les fiches, puis
 * extraire chaque fiche. L'extraction est une fonction pure, testée sur des extraits HTML.
 */
export interface SourceAdapter {
  /** Identifiant stocké dans les relevés de prix et le journal des exécutions. */
  id: string;
  brandSlug: string;
  /** URL des fiches produits à visiter. */
  discover(): Promise<string[]>;
  /** Fiche extraite (non encore validée), ou `null` si la page n'est pas une fiche montre. */
  parse($: CheerioAPI, url: string): Listing | null;
}
