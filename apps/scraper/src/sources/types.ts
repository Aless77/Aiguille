import { type CheerioAPI } from "cheerio";

import { type Listing } from "../lib/listing.ts";
import { type Offer } from "../lib/offer.ts";

/**
 * Un adaptateur par source (cahier des charges, section Risques) : découvrir les fiches, puis
 * extraire chaque fiche. L'extraction est une fonction pure, testée sur des extraits HTML.
 */
interface BaseAdapter {
  /** Identifiant stocké dans les relevés de prix et le journal des exécutions. */
  id: string;
  /** URL des fiches produits à visiter. */
  discover(): Promise<string[]>;
}

/** Site officiel d'une marque : définit le catalogue (crée et met à jour les montres). */
export interface OfficialAdapter extends BaseAdapter {
  kind: "official";
  brandSlug: string;
  /** Fiche extraite (non encore validée), ou `null` si la page n'est pas une fiche montre. */
  parse($: CheerioAPI, url: string): Listing | null;
}

/**
 * Revendeur : ne crée jamais de montre, il rattache ses offres (prix, stock) aux montres du
 * catalogue par la référence. Une fiche sans montre correspondante est ignorée.
 */
export interface RetailerAdapter extends BaseAdapter {
  kind: "retailer";
  /** Offre extraite (non encore validée), ou `null` si la page n'est pas une montre suivie. */
  parse($: CheerioAPI, url: string): Offer | null;
}

export type SourceAdapter = OfficialAdapter | RetailerAdapter;
