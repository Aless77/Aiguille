/**
 * Faits techniques d'une montre, extraits de sa fiche officielle (`rawSpecs`, telle que publiée
 * par la marque) : ils fondent la Note Aiguille (rating.ts) et la base des calibres. Aucune valeur
 * n'est inventée : une donnée que la marque ne publie pas reste inconnue (null / false).
 */

export type Movement = "automatique" | "manuel" | "quartz" | "solaire" | "autre";

export const COMPLICATIONS = {
  chronograph: "Chronographe",
  gmt: "Second fuseau horaire (GMT)",
  moonphase: "Phases de lune",
  annualCalendar: "Calendrier annuel",
  perpetualCalendar: "Calendrier perpétuel",
  dayDate: "Jour et date",
  powerReserveIndicator: "Indicateur de réserve de marche",
  alarm: "Alarme",
} as const;
export type Complication = keyof typeof COMPLICATIONS;

export interface WatchSource {
  name: string;
  collectionName: string | null;
  movement: Movement | null;
  caliber: string | null;
  diameterMm: number | null;
  waterResistanceM: number | null;
  powerReserveH: number | null;
  caseMaterial: string | null;
  crystal: string | null;
  rawSpecs: Record<string, string>;
}

export interface MovementFacts {
  caliber: string | null;
  type: Movement | null;
  /** Alternances par heure (25 200, 28 800…), si la marque la publie. */
  frequencyVph: number | null;
  powerReserveH: number | null;
  /** Spiral en silicium (antimagnétique, insensible aux chocs thermiques). */
  siliconHairspring: boolean;
  /** Spiral silicium ou Nivachron, ou résistance magnétique annoncée par la marque. */
  antimagnetic: boolean;
  /** Certifié chronomètre (COSC). */
  chronometer: boolean;
  complications: Complication[];
}

export interface ConstructionFacts {
  sapphire: boolean;
  crystalKnown: boolean;
  materialKnown: boolean;
  antiReflective: boolean;
  waterResistanceM: number | null;
  /** Matière noble : titane, céramique, or, platine, bronze. */
  nobleMaterial: string | null;
  exhibitionCaseback: boolean;
  screwDownCrown: boolean;
  luminescent: boolean;
  /** Lunette en céramique (inrayable). */
  ceramicBezel: boolean;
  /** Montre joaillerie (diamants) : comparée à ses semblables. */
  gemSet: boolean;
}

const yes = (v: string | undefined) => v !== undefined && /^(oui|yes)\b/i.test(v.trim());

/** Tout le texte de la fiche, « libellé : valeur », pour les recherches de mots-clés. */
const normalized = new WeakMap<Record<string, string>, Record<string, string>>();

/**
 * Fiche normalisée en Unicode NFC : certaines marques (Tissot) écrivent des accents décomposés
 * (« e » + accent), invisibles à l'écran mais qui font échouer toute comparaison de libellé.
 */
export function specs(w: Pick<WatchSource, "rawSpecs">): Record<string, string> {
  let result = normalized.get(w.rawSpecs);
  if (!result) {
    result = Object.fromEntries(
      Object.entries(w.rawSpecs).map(([k, v]) => [k.normalize("NFC"), v.normalize("NFC")]),
    );
    normalized.set(w.rawSpecs, result);
  }
  return result;
}

function specText(w: WatchSource): string {
  return [w.name.normalize("NFC"), ...Object.entries(specs(w)).map(([k, v]) => `${k} : ${v}`)].join(
    " | ",
  );
}

export function extractMovementFacts(w: WatchSource): MovementFacts {
  const text = specText(w);
  const frequency = /(\d{2})[\s .]?(\d{3})\s*(?:vibrations|alternances)/i.exec(text);
  const silicon = /(spiral|ressort)[^|]{0,40}silicium|silicon hairspring|si14/i.test(text);
  const nivachron = yes(specs(w)["Nivachron"]) || /(spiral|ressort)[^|]{0,40}nivachron/i.test(text);
  const complications = (Object.keys(COMPLICATIONS) as Complication[]).filter((c) =>
    COMPLICATION_PATTERNS[c].test(text),
  );

  return {
    caliber: w.caliber?.trim() || null,
    type: w.movement,
    frequencyVph: frequency ? Number(`${frequency[1]}${frequency[2]}`) : null,
    powerReserveH: w.powerReserveH,
    siliconHairspring: silicon,
    antimagnetic:
      silicon ||
      nivachron ||
      yes(specs(w)["Général · Résistance magnétique"]) ||
      /antimagn[ée]tique/i.test(text),
    chronometer:
      yes(specs(w)["Général · Chronometer Officially Certified"]) ||
      /\bCOSC\b|chronom[eè]tre certifi|certification chronom[eè]tre|certified chronometer/i.test(
        text,
      ),
    complications,
  };
}

const COMPLICATION_PATTERNS: Record<Complication, RegExp> = {
  // « chrono » seul, mais pas « chronomètre » (certification de précision, pas une complication).
  chronograph: /chronograph|\bchrono\b(?!m)/i,
  gmt: /\bGMT\b|second fuseau|deuxi[eè]me fuseau|double fuseau|fuseaux horaires|zulu time|heure universelle|worldtimer/i,
  moonphase: /phases? de (la )?lune|moon ?phase/i,
  annualCalendar: /calendrier annuel/i,
  perpetualCalendar: /calendrier perp[ée]tuel/i,
  dayDate: /jour[- ]date|day[- ]date|jour et (la )?date/i,
  powerReserveIndicator: /indicat(eur|ion) de (la )?r[ée]serve de marche/i,
  alarm: /\balarme\b|\br[ée]veil\b/i,
};

export function extractConstructionFacts(w: WatchSource): ConstructionFacts {
  const text = specText(w);
  const material = w.caseMaterial ?? "";
  const noble = /titane|c[ée]ramique|\bor\b|bronze|platine/i.exec(material);
  return {
    sapphire: /saphir|sapphire/i.test(w.crystal ?? ""),
    crystalKnown: Boolean(w.crystal?.trim()),
    materialKnown: Boolean(material.trim()),
    antiReflective:
      /anti-?reflet|antireflet/i.test(
        `${w.crystal ?? ""} ${specs(w)["Revêtement du verre"] ?? ""}`,
      ) || yes(specs(w)["Anti-reflet"]),
    waterResistanceM: w.waterResistanceM,
    nobleMaterial: noble ? material : null,
    exhibitionCaseback:
      yes(specs(w)["Fond transparent"]) ||
      /transparent/i.test(specs(w)["Boîtier · Fond"] ?? "") ||
      // Tissot : « Fond de boîte transparent ».
      /fond[^|]{0,20}(saphir|transparent)/i.test(text),
    // Tissot : « Couronne et fond de boîte vissés ».
    screwDownCrown:
      yes(specs(w)["Couronne vissée"]) || /couronne( et fond de bo[iî]te)? viss[ée]/i.test(text),
    luminescent: /luminova|luminescent|lumibrite/i.test(text),
    gemSet: /diamant/i.test(text),
    ceramicBezel: /lunette[^|]{0,40}c[ée]ramique|c[ée]ramique[^|]{0,20}lunette/i.test(text),
  };
}

// ── Propriété : garantie, origine, entretien, bracelet ──────────────────────────────────────

export interface OwnershipFacts {
  /** Garantie internationale annoncée sur la fiche de la montre (en mois). */
  warrantyMonths: number | null;
  /** Pays de fabrication déclaré par la marque. */
  madeIn: string | null;
  /** Référence de pile publiée (montres à quartz) : standard ou non. */
  battery: string | null;
  /** Indicateur de fin de vie de la pile (E.O.L.). */
  endOfLifeIndicator: boolean;
  /** Bracelet interchangeable sans outil (Easy Click, ouverture facile…). */
  interchangeableStrap: boolean;
  deployantClasp: boolean;
  /** Mécanisme de chronographe publié (roue à colonnes, flyback, monopoussoir). */
  chronographMechanism: string[];
  /** Pièce vintage (Longines Heritage…) : année de production, ou null pour une montre neuve. */
  vintageYear: number | null;
}

export function extractOwnershipFacts(w: WatchSource): OwnershipFacts {
  const text = specText(w);
  const warranty = /(\d+)\s*ans? de garantie|garantie[^|]{0,20}?(\d+)\s*ans/i.exec(
    specs(w)["Garantie"] ?? "",
  );
  // Référence normalisée (CEI) : « RENATA 321 - SR716SW - 1.55V » → SR716SW.
  const battery = /\b(SR\s?\d{3,4}\s?[A-Z]{0,2}|CR\s?\d{4})\b/.exec(
    specs(w)["Mouvement · Pile"] ?? "",
  );
  const chrono = specs(w)["Mouvement · Chronographe"] ?? "";
  const year = Number(specs(w)["Date de production"]);
  return {
    warrantyMonths: warranty ? Number(warranty[1] ?? warranty[2]) * 12 : null,
    madeIn: specs(w)["Pays de fabrication"]?.trim() || null,
    battery: battery ? battery[1]!.replace(/\s+/g, "") : null,
    endOfLifeIndicator: /\bE\.?O\.?L\.?\b|fin de vie de la pile/i.test(text),
    interchangeableStrap:
      yes(specs(w)["Easy Click"]) ||
      /interchangeab|ouverture facile|easy ?click/i.test(
        `${specs(w)["Bracelet · Interchangeabilité"] ?? ""} ${specs(w)["Option du bracelet"] ?? ""} ${specs(w)["Easy Click"] ?? ""}`,
      ),
    deployantClasp: /d[ée]ployante|papillon/i.test(
      `${specs(w)["Type de boucle"] ?? ""} ${specs(w)["Bracelet · Boucle"] ?? ""} ${specs(w)["Fermoir"] ?? ""} ${specs(w)["Caractéristiques du bracelet"] ?? ""}`,
    ),
    chronographMechanism: [
      /roue [àa] colonnes?/i.test(chrono) && "Roue à colonnes",
      /flyback/i.test(chrono) && "Flyback",
      /monopoussoir/i.test(chrono) && "Monopoussoir",
    ].filter((v): v is string => Boolean(v)),
    vintageYear: Number.isInteger(year) && year > 1800 && year < 2100 ? year : null,
  };
}

// ── Catégorie : gamme de prix × famille ─────────────────────────────────────────────────────

export const PRICE_BANDS = [
  { id: "entree", label: "Entrée de gamme", max: 500 },
  { id: "accessible", label: "Accessible", max: 1000 },
  { id: "milieu", label: "Milieu de gamme", max: 2000 },
  { id: "milieu-haut", label: "Milieu-haut de gamme", max: 5000 },
  { id: "haut", label: "Haut de gamme", max: 15000 },
  { id: "luxe", label: "Luxe", max: Infinity },
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number]["id"];

/** Gamme de prix d'une montre (prix catalogue en centimes) ; null sans prix. */
export function priceBand(priceCents: number | null): PriceBand | null {
  if (priceCents === null) return null;
  return PRICE_BANDS.find((b) => priceCents / 100 < b.max)!.id;
}

export const FAMILIES = {
  plongee: "plongée",
  gmt: "voyage (GMT)",
  chronographe: "chronographes",
  pilote: "aviateur",
  joaillerie: "joaillerie",
  habillee: "habillées",
  quotidien: "sport et quotidien",
} as const;
export type Family = keyof typeof FAMILIES;

const DIVER = /plong[ée]e|diver|hydroconquest|seastar|scuba|frogman|belowzero|legend diver/i;
const PILOT = /aviation|pilot|spirit|x-wind|flieger|aviateur|khaki pilot/i;
const DRESS =
  /jazzmaster|american classic|le locle|carson|everytime|master collection|elegant|grande classique|dolcevita|record|flagship|heritage|conquest classic|primaluna|mini dolcevita|lady|classique|tradition|symphonette|evidenza|cl[ée]ment|presage|king seiko|citizen l/i;

/** Famille d'usage : une montre est comparée aux montres du même usage et du même prix. */
export function family(w: WatchSource, m: MovementFacts, c: ConstructionFacts): Family {
  const label = `${w.collectionName ?? ""} ${w.name}`;
  if (DIVER.test(label) || (c.waterResistanceM ?? 0) >= 200) return "plongee";
  if (m.complications.includes("gmt")) return "gmt";
  if (m.complications.includes("chronograph")) return "chronographe";
  if (PILOT.test(label)) return "pilote";
  if (c.gemSet) return "joaillerie";
  if (DRESS.test(label)) return "habillee";
  return "quotidien";
}
