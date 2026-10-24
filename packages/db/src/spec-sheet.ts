/**
 * Fiche technique commune à toutes les marques : **mêmes rubriques, mêmes lignes, même ordre**,
 * quelle que soit la façon dont chaque marque nomme ses caractéristiques. Chaque ligne liste les
 * libellés des fiches officielles (`rawSpecs`) qui l'alimentent ; une ligne sans valeur reste
 * affichée, « non communiqué ». Nouvelle marque : ajouter ses libellés ici
 * (docs/integrer-une-marque.md) ; le reste de sa fiche apparaît dans « Autres informations ».
 */
import {
  BRAND_INFO,
  careTipsFor,
  type CareTip,
  movementMaker,
  servicePricesFor,
  warrantyFor,
} from "./brand-info.ts";
import {
  COMPLICATIONS,
  extractConstructionFacts,
  extractMovementFacts,
  extractOwnershipFacts,
  specs,
  type Movement,
  type WatchSource,
} from "./facts.ts";

export interface SheetInput extends WatchSource {
  brandSlug: string;
  thicknessMm: number | null;
  lugWidthMm: number | null;
  dialColor: string | null;
  strapMaterial: string | null;
  /** Points de vente agréés de la marque en Europe (boutiques collectées). */
  storeCount: number;
}

export interface SheetRow {
  label: string;
  /** null : la marque ne publie pas l'information. */
  value: string | null;
  note?: string;
  /** Lien vers la page de la marque qui détaille l'information. */
  link?: { href: string; label: string };
}

export interface SheetGroup {
  id: "mouvement" | "boitier" | "cadran" | "bracelet" | "garantie" | "historique";
  title: string;
  rows: SheetRow[];
}

export interface SpecSheet {
  groups: SheetGroup[];
  /** Libellés de la fiche officielle non repris dans les rubriques : rien n'est perdu. */
  others: [label: string, value: string][];
  /** Conseils d'utilisation adaptés à la montre (marque ou conseil général). */
  care: CareTip[];
}

const MOVEMENT_LABELS: Record<Movement, string> = {
  automatique: "Mécanique automatique",
  manuel: "Mécanique à remontage manuel",
  quartz: "Quartz",
  solaire: "Quartz solaire",
  autre: "Autre",
};

// ── Formats ─────────────────────────────────────────────────────────────────────────────────

const fr = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/ /g, " ");

/** « 10.20 », « 10,2 », « 10.2 mm » → nombre. */
function parseNumber(value: string): number | null {
  const m = /(\d+(?:[.,]\d+)?)/.exec(value);
  return m ? Number(m[1]!.replace(",", ".")) : null;
}

const mm = (n: number | null) => (n === null ? null : `${fr(n)} mm`);
const unit = (u: string) => (v: string | null) => {
  if (v === null) return null;
  const n = parseNumber(v);
  return n === null ? v : `${fr(n)} ${u}`;
};
/** « 15mm x 19mm », « 14.30 x 18.00 mm » → « 15 × 19 mm ». */
function dimensions(v: string | null): string | null {
  if (v === null) return null;
  const parts = v.split(/\s*[x×X]\s*/).map(parseNumber);
  if (parts.length !== 2 || parts.some((p) => p === null)) return null;
  // Montre ronde (« 40 x 40 mm ») : le diamètre suffit.
  if (parts[0] === parts[1]) return null;
  return `${fr(parts[0]!)} × ${fr(parts[1]!)} mm`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Lecture des fiches ──────────────────────────────────────────────────────────────────────

/** Libellés de fiche lus par les lignes de la fiche commune (le reste va en « autres »). */

/** Libellés sans intérêt pour le visiteur, ou déjà affichés ailleurs sur la page. */
const IGNORED = new Set([
  "Collection",
  "Référence",
  "Statut",
  "Environnement",
  "Custom Tags",
  "Référence du bracelet XL",
]);

function rawReader(w: SheetInput, consumed: Set<string>) {
  /** Valeurs distinctes des libellés donnés, dans l'ordre ; null si aucune. */
  return (...keys: string[]): string | null => {
    keys.forEach((k) => consumed.add(k));
    const values = keys
      .map((k) => specs(w)[k]?.trim())
      .filter((v): v is string => Boolean(v) && v !== "-");
    return values.length ? [...new Set(values)].join(" · ") : null;
  };
}

const yes = (v: string | null) => v !== null && /^(oui|yes)\b/i.test(v);

/** Fiche commune d'une montre. */
export function buildSpecSheet(w: SheetInput): SpecSheet {
  const consumed = new Set<string>();
  const raw = rawReader(w, consumed);
  const m = extractMovementFacts(w);
  const c = extractConstructionFacts(w);
  const o = extractOwnershipFacts(w);
  const quartz = m.type === "quartz" || m.type === "solaire";
  const vintage =
    o.vintageYear !== null ||
    ["Numéro de série", "Date de vente", "Condition", "Documents"].some((k) => specs(w)[k]);
  const maker = movementMaker(w.brandSlug, m.caliber);
  const warranty = warrantyFor(w.brandSlug, o.warrantyMonths, m.type, {
    vintage,
    chronometer: m.chronometer,
    lightmaster: /lightmaster/i.test(`${w.name} ${JSON.stringify(w.rawSpecs)}`),
  });
  const service = servicePricesFor(w.brandSlug, m.type, m.complications.includes("chronograph"), {
    vintage,
    tactile: w.brandSlug === "tissot" && /t[ -]?touch/i.test(`${w.name} ${w.collectionName ?? ""}`),
  });

  // Libellés lus par les extracteurs de faits : déjà représentés par une ligne.
  raw(
    "Mouvement",
    "Type de mouvement",
    "Mouvement · Type de mouvement",
    "Mouvement · Calibre",
    "Calibre",
    "Réserve de marche",
    "Réserve de marche (heures)",
    "Nivachron",
    "Spiral en silicium",
    "Général · Résistance magnétique",
    "Général · Chronometer Officially Certified",
    "Certifié Chronomètre COSC",
    "Garantie",
    "Pays de fabrication",
    "Easy Click",
    "Option du bracelet",
    "Bracelet · Interchangeabilité",
    "Interchangeabilité",
    "Anti-reflet",
    "Fond transparent",
    "Couronne vissée",
    "Étanchéité",
    "Boîtier · Étanchéité",
    "Etanchéité de la boîte",
    "Verre",
    "Type de glace",
    "Boîtier · Glace",
    "Matériau du boîtier",
    "Matière de la boîte",
    "Boîtier · Matière",
    "Épaisseur (mm)",
    "Epaisseur de la boîte (mm)",
    "Boîtier · Épaisseur",
    "Largeur corne",
    "Entre-cornes (mm)",
    "Boîtier · Entrecorne",
    "Couleur du cadran",
    "Cadran · Couleur cadran",
    "Type de bracelet",
    "Matière du bracelet",
    "Bracelet · Matière",
    "Date de production",
    "Mouvement · Pile",
    "Tension de la batterie",
  );

  // Pièces vintage Longines : la description est dans « Mouvement » (texte long).
  const longMovement = specs(w)["Mouvement"]?.trim();
  const description =
    raw("Mouvement · Description mouvement") ??
    (longMovement && longMovement.length > 40 ? longMovement : null);
  const functions = raw(
    "Fonctions de la montre",
    "Mouvement · Fonctions",
    "Mouvement · Fonction",
    "Fonctions principales",
    "Fonctions",
  );
  const chronograph = raw("Mouvement · Chronographe", "Mouvement · Fonctions du chronographe");
  const special = raw("Mouvement · Fonction spéciale", "Fonctions du mouvement");

  const movement: SheetRow[] = [
    { label: "Type", value: m.type ? MOVEMENT_LABELS[m.type] : null },
    { label: "Calibre", value: m.caliber },
    { label: "Constructeur du mouvement", value: maker?.value ?? null },
    {
      label: "Réserve de marche",
      value: quartz ? "Sans objet (quartz)" : m.powerReserveH ? `${m.powerReserveH} heures` : null,
    },
    {
      label: "Fréquence",
      value: quartz
        ? "Sans objet (quartz)"
        : m.frequencyVph
          ? `${fr(m.frequencyVph)} alternances par heure`
          : null,
    },
    {
      label: "Spiral et magnétisme",
      value: m.siliconHairspring
        ? "Spiral en silicium, amagnétique"
        : m.antimagnetic
          ? /nivachron/i.test(Object.entries(specs(w)).flat().join(" ")) &&
            specs(w)["Nivachron"] !== "Non"
            ? "Spiral Nivachron, antimagnétique"
            : "Antimagnétique"
          : quartz
            ? "Sans objet (quartz)"
            : null,
    },
    { label: "Certification chronomètre", value: m.chronometer ? "Oui, COSC" : "Non mentionnée" },
    {
      label: "Fonctions",
      value:
        [
          functions,
          m.complications.length ? m.complications.map((x) => COMPLICATIONS[x]).join(", ") : null,
          chronograph,
          // Fonctions spéciales (E.O.L., compteurs…), sans la mention du spiral (ligne dédiée).
          special
            ?.split(/,s*/)
            .filter((s) => !/spiral/i.test(s))
            .join(", ") || null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
    },
    ...(quartz
      ? [
          {
            label: "Pile",
            value:
              m.type === "solaire"
                ? "Accumulateur rechargé par la lumière"
                : [
                    o.battery && `${o.battery}`,
                    raw("Tension de la batterie") && `${raw("Tension de la batterie")} V`,
                  ]
                    .filter(Boolean)
                    .join(", ") || null,
            note: o.endOfLifeIndicator ? "Indicateur de fin de vie de la pile." : undefined,
          },
        ]
      : []),
    {
      label: "Description",
      value: description,
    },
  ];

  const tissotWidth = raw("Largeur de la boîte (mm)");
  const tissotLength = raw("Longueur de la boite (mm)");
  const shape = raw("Boîtier · Forme");
  const caseDimensions =
    dimensions(raw("Boîtier · Dimension", "Dimension du boîtier")) ??
    (tissotWidth && tissotLength && tissotWidth !== tissotLength
      ? dimensions(`${tissotWidth} x ${tissotLength}`)
      : null);

  const caseRows: SheetRow[] = [
    { label: "Diamètre", value: mm(w.diameterMm) },
    ...(caseDimensions ? [{ label: "Dimensions", value: caseDimensions }] : []),
    { label: "Forme", value: shape },
    { label: "Épaisseur", value: mm(w.thicknessMm) },
    {
      label: "Corne à corne",
      value: unit("mm")(raw("Boîtier · Hauteur corne à corne", "Lug to lug")),
    },
    { label: "Entre-cornes", value: mm(w.lugWidthMm) },
    {
      label: "Matière",
      value:
        [w.caseMaterial, raw("Revêtement"), raw("Boîtier · Type de boîtier")]
          .filter(Boolean)
          .join(" · ") || null,
    },
    {
      label: "Lunette",
      value: raw("Matière de la lunette") ?? (c.ceramicBezel ? "Céramique" : null),
    },
    {
      label: "Verre",
      value: c.crystalKnown
        ? `${cap(w.crystal!.trim())}${c.antiReflective && !/antireflet|anti-reflet/i.test(w.crystal!) ? ", antireflet" : ""}`
        : null,
    },
    {
      label: "Fond",
      value: raw("Boîtier · Fond") ?? (c.exhibitionCaseback ? "Transparent" : null),
    },
    { label: "Couronne vissée", value: c.screwDownCrown ? "Oui" : "Non mentionnée" },
    { label: "Étanchéité", value: w.waterResistanceM ? `${w.waterResistanceM} m` : null },
    { label: "Particularités", value: raw("Boîtier · Spécificités", "Options de la boîte") },
    { label: "Poids", value: unit("g")(raw("Boîtier · Poids", "Poids (g)")) },
  ];

  const tissotDiamonds = raw("Diamants du cadran");
  const carats = raw("Nombre de carats");
  const dial: SheetRow[] = [
    { label: "Couleur", value: w.dialColor },
    { label: "Index", value: raw("Cadran · Tour d'heures", "Type d'index") },
    { label: "Aiguilles", value: raw("Cadran · Aiguilles", "Cadran · Aiguilles du cadran") },
    {
      label: "Luminescence",
      value:
        raw(
          "Matière luminescente sur les aiguilles",
          "Matière luminescente sur la lunette",
          "Cadran · Spécificités",
        ) ??
        (yes(raw("Super Luminova")) ? "Super-LumiNova" : c.luminescent ? "Oui" : "Non mentionnée"),
    },
    {
      label: "Pierres précieuses",
      value:
        raw("Cadran · Diamants", "Boîtier · Diamants") ??
        (tissotDiamonds
          ? `${fr(parseNumber(tissotDiamonds) ?? 0)} diamants${carats && parseNumber(carats) ? `, ${fr(parseNumber(carats)!)} carat` : ""}`
          : "Aucune mentionnée"),
    },
    { label: "Description", value: raw("Cadran · Description") },
  ];
  raw(
    "Type de pierre précieuse",
    "Pureté des diamants",
    "Couleur des diamants",
    "Taille des diamants",
    "Diamants de la boîte",
  );

  const top = raw("Bracelet · Dessus", "Dessus du bracelet");
  const under = raw("Bracelet · Dessous", "Dessous du bracelet");
  const brin12 = raw("Taille du brin à 12 h (mm)");
  const brin6 = raw("Taille du brin à 6 h (mm)");
  const strap: SheetRow[] = [
    {
      label: "Matière",
      value:
        [
          w.strapMaterial,
          top && `dessus : ${top}`,
          under && `dessous : ${under}`,
          raw("Revêtement du bracelet") && `revêtement ${raw("Revêtement du bracelet")}`,
        ]
          .filter(Boolean)
          .join(" · ") || null,
    },
    { label: "Couleur", value: raw("Couleur du bracelet", "Bracelet · Couleur") },
    {
      label: "Boucle",
      value: raw("Type de boucle", "Bracelet · Boucle", "Boucle (deuxième bracelet)"),
    },
    { label: "Largeur à la boucle", value: unit("mm")(raw("Largeur de la boucle")) },
    {
      label: "Longueur des brins",
      value:
        brin12 && brin6
          ? `${fr(parseNumber(brin12)!)} mm (12 h) et ${fr(parseNumber(brin6)!)} mm (6 h)`
          : null,
    },
    {
      label: "Interchangeable sans outil",
      value: o.interchangeableStrap ? "Oui" : "Non mentionné",
    },
    { label: "Référence du bracelet", value: raw("Référence du bracelet") },
  ];

  const date = (iso: string) => iso.split("-").reverse().join("/");
  const brandMadeIn = BRAND_INFO[w.brandSlug]?.madeIn;
  const care: SheetRow[] = [
    {
      label: "Garantie internationale",
      value: warranty ? `${fr(warranty.months / 12)} ans` : null,
      note:
        warranty?.extended.map((e) => `${fr(e.months / 12)} ans : ${e.when}.`).join(" ") ||
        undefined,
      link: warranty?.page ? { href: warranty.page, label: "Détail de la garantie" } : undefined,
    },
    {
      label: "Non couvert par la garantie",
      value: warranty?.excludes.length ? cap(warranty.excludes.join(", ")) : null,
    },
    {
      label: "Garantie de la révision",
      value: service?.serviceWarrantyMonths ? `${fr(service.serviceWarrantyMonths)} mois` : null,
    },
    { label: "Pièces de rechange", value: service?.spareParts ? cap(service.spareParts) : null },
    { label: "Fabrication", value: o.madeIn ?? brandMadeIn?.value ?? null },
    {
      label: "Révision complète",
      value: service?.full ? `${fr(service.full)} €` : null,
      note: service
        ? [
            `Prix conseillé par la marque en France, relevé le ${date(service.checkedAt)}.`,
            service.priceNote,
            service.free.length && `Offerts : ${service.free.join(", ")}.`,
          ]
            .filter(Boolean)
            .join(" ")
        : undefined,
      link: service ? { href: service.source, label: "Tarifs de la marque" } : undefined,
    },
    { label: "Révision partielle", value: service?.partial ? `${fr(service.partial)} €` : null },
    ...(quartz
      ? [
          {
            label: "Remplacement de la pile",
            value:
              m.type === "solaire"
                ? "Sans objet (rechargée par la lumière)"
                : service?.battery
                  ? `${fr(service.battery)} €`
                  : null,
            note:
              m.type === "solaire"
                ? undefined
                : [
                    service?.batteryNote,
                    service?.batteryLife && `Durée de vie d'une pile : ${service.batteryLife}.`,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined,
          },
        ]
      : []),
    {
      label: "Révision complète conseillée",
      value:
        service?.fullServiceInterval &&
        ((m.type !== "quartz" && m.type !== "solaire") || w.brandSlug === "tissot")
          ? cap(service.fullServiceInterval)
          : null,
      link: service
        ? {
            href: service.adviceSources?.[0] ?? service.source,
            label: "Recommandations de la marque",
          }
        : undefined,
    },
    {
      label: "Révision partielle conseillée",
      value: service?.partialServiceInterval ? cap(service.partialServiceInterval) : null,
    },
    {
      label: "Contrôle d'étanchéité conseillé",
      value: service?.waterResistanceCheck ? cap(service.waterResistanceCheck) : null,
      link: service
        ? { href: service.adviceSources?.at(-1) ?? service.source, label: "Conseils de la marque" }
        : undefined,
    },
    {
      label: "Points de vente agréés en Europe",
      value: w.storeCount > 0 ? `${fr(w.storeCount)} répertoriés` : null,
    },
  ];

  const groups: SheetGroup[] = [
    { id: "mouvement", title: "Mouvement", rows: movement },
    { id: "boitier", title: "Boîtier", rows: caseRows },
    { id: "cadran", title: "Cadran", rows: dial },
    { id: "bracelet", title: "Bracelet", rows: strap },
    { id: "garantie", title: "Garantie et entretien", rows: care },
  ];

  // Pièces vintage : une rubrique de plus, seulement pour elles.
  if (vintage) {
    groups.push({
      id: "historique",
      title: "Historique",
      rows: [
        { label: "Année de production", value: o.vintageYear ? String(o.vintageYear) : null },
        { label: "Numéro de série", value: raw("Numéro de série") },
        { label: "Vente d'origine", value: raw("Date de vente") },
        { label: "État", value: raw("Condition") },
        { label: "Documents", value: raw("Documents") },
        { label: "Type de montre", value: raw("Type de montre") },
      ],
    });
  }

  // Lignes « Description » vides : inutiles à afficher (texte libre, rarement publié).
  for (const g of groups) g.rows = g.rows.filter((r) => r.label !== "Description" || r.value);

  const others = Object.entries(specs(w))
    .filter(([k, v]) => !consumed.has(k) && !IGNORED.has(k) && v.trim() && v.trim() !== "-")
    .map(([k, v]): [string, string] => [k.replace(/^[^·]+ · /, ""), v.trim()]);

  const tips = careTipsFor(w.brandSlug, {
    vintage,
    movement: m.type,
    screwDownCrown: c.screwDownCrown,
    chronograph: m.complications.includes("chronograph"),
    antimagnetic: m.antimagnetic,
    waterResistanceM: w.waterResistanceM,
  });

  return { groups, others, care: tips };
}
