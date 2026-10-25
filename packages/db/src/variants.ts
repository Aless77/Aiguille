/**
 * Déclinaisons d'un même modèle (couleur de cadran, matière, bracelet) et ses autres tailles,
 * comme le sélecteur des sites des marques. Fonctions pures, sans base : la page fiche leur passe
 * les montres de la même collection.
 *
 * Le regroupement s'appuie sur la structure des références, propre à chaque marque : la partie
 * « modèle » est commune à toutes les déclinaisons, le reste code le cadran, la matière ou le
 * bracelet. Nouvelle marque : ajouter son motif à MODEL_KEYS (docs/integrer-une-marque.md).
 */

/** Partie « modèle » de la référence, par marque. Sans motif, la montre n'a pas de déclinaisons. */
export const MODEL_KEYS: Record<string, RegExp> = {
  // T137.407.11.041.00 : modèle T137.407, puis boîtier/bracelet et cadran.
  tissot: /^(T\d{3}\.\d{3})\.\d{2}\.\d{3}\.\d{2}$/i,
  // L3.781.4.76.6 : modèle L3.781, puis matière, cadran et bracelet.
  longines: /^(L\d\.\d{3})\.\d\.\d{2}\.\d$/i,
  // H32705141 : modèle H32705, puis trois chiffres de déclinaison.
  hamilton: /^(H\d{5})\d{3}$/i,
};

export function modelKey(brandSlug: string, reference: string): string | null {
  const match = MODEL_KEYS[brandSlug]?.exec(reference.trim());
  return match?.[1]?.toUpperCase() ?? null;
}

/** Nom sans la taille ni les espaces superflus : « Open Heart  Auto 42mm » → « open heart auto ». */
export function baseName(name: string): string {
  return name
    .normalize("NFC")
    .replace(/\s*\d+(?:[.,]\d+)?\s*mm\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export interface VariantCandidate {
  slug: string;
  reference: string;
  name: string;
  diameterMm: number | null;
  dialColor: string | null;
  caseMaterial: string | null;
  strapMaterial: string | null;
  priceCents: number | null;
  discontinued: boolean;
}

export interface Variant<T extends VariantCandidate> {
  watch: T;
  current: boolean;
  /** Ce qui distingue cette déclinaison des autres (cadran, boîtier, bracelet). */
  label: string;
}

export interface SizeOption<T extends VariantCandidate> {
  diameterMm: number;
  current: boolean;
  /** Montre ouverte en choisissant cette taille (celle de la page pour la taille actuelle). */
  watch: T;
}

export interface ModelVariants<T extends VariantCandidate> {
  variants: Variant<T>[];
  sizes: SizeOption<T>[];
}

const DISTINCTIVE = [
  ["dialColor", "Cadran"],
  ["caseMaterial", "Boîtier"],
  ["strapMaterial", "Bracelet"],
] as const;

function same(a: string | null, b: string | null): boolean {
  return (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
}

function byAvailabilityThenPrice(a: VariantCandidate, b: VariantCandidate): number {
  return (
    Number(a.discontinued) - Number(b.discontinued) ||
    (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity) ||
    a.reference.localeCompare(b.reference)
  );
}

/**
 * Déclinaisons de `current` parmi `candidates` (même marque, même collection) : même modèle de
 * référence et même diamètre. Tailles : autres modèles portant le même nom une fois la taille
 * retirée. Rien n'est renvoyé pour une montre seule ou sans motif de référence (pièces vintage).
 */
export function modelVariants<T extends VariantCandidate>(
  brandSlug: string,
  current: T,
  candidates: T[],
): ModelVariants<T> {
  const key = modelKey(brandSlug, current.reference);
  if (!key) return { variants: [], sizes: [] };
  const others = candidates.filter((c) => c.slug !== current.slug);

  const siblings = [
    current,
    ...others.filter(
      (c) => modelKey(brandSlug, c.reference) === key && c.diameterMm === current.diameterMm,
    ),
  ].sort(byAvailabilityThenPrice);
  const differing = DISTINCTIVE.filter(([field]) =>
    siblings.some((s) => !same(s[field], current[field])),
  );
  const variants =
    siblings.length > 1
      ? siblings.map((watch) => ({
          watch,
          current: watch.slug === current.slug,
          label:
            differing
              .map(([field, prefix]) => (watch[field] ? `${prefix} ${watch[field]}` : null))
              .filter((part): part is string => part !== null)
              .join(" · ") || watch.reference,
        }))
      : [];

  const base = baseName(current.name);
  const bySize = new Map<number, T[]>();
  for (const c of others) {
    if (c.diameterMm == null || c.diameterMm === current.diameterMm) continue;
    if (!modelKey(brandSlug, c.reference) || baseName(c.name) !== base) continue;
    bySize.set(c.diameterMm, [...(bySize.get(c.diameterMm) ?? []), c]);
  }
  // Pour chaque taille, la déclinaison la plus proche : même cadran si possible, puis disponible.
  const sizes: SizeOption<T>[] = [...bySize].map(([diameterMm, group]) => ({
    diameterMm,
    current: false,
    watch: group.sort(
      (a, b) =>
        Number(!same(a.dialColor, current.dialColor)) -
          Number(!same(b.dialColor, current.dialColor)) || byAvailabilityThenPrice(a, b),
    )[0]!,
  }));
  if (sizes.length && current.diameterMm != null) {
    sizes.push({ diameterMm: current.diameterMm, current: true, watch: current });
  }
  sizes.sort((a, b) => a.diameterMm - b.diameterMm);

  return { variants, sizes };
}
