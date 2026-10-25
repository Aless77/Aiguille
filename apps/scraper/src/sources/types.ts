import { type WatchTranslationData } from "@aiguille/db/translations";
import { type CheerioAPI } from "cheerio";

import { type Country } from "../lib/countries.ts";
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
  /**
   * Fiche dans la langue de la page (française ou version nationale), valeurs rangées par clé
   * stable : affichage du site dans d'autres langues (packages/db/src/translations.ts).
   */
  translate?($: CheerioAPI, url: string): WatchTranslationData | null;
  /**
   * Versions nationales du site (lot 4, prix par pays). Un pays absent n'a pas de version
   * nationale propre (redirection vers un site « international ») : il n'est pas relevé.
   */
  locales: Partial<Record<Country, string>>;
  /** URL de la fiche française → URL de la même fiche dans une autre version nationale. */
  localizeUrl(frenchUrl: string, locale: string): string;
  /**
   * Boutiques agréées publiées par la marque (lot 4), si son robots.txt l'autorise. Chaque page
   * porte un JSON-LD de lieu (adresse et coordonnées), lu par parseStoreListing.
   */
  stores?: { id: string; discover(): Promise<string[]> };
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
