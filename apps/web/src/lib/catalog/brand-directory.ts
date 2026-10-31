/** Annuaire des marques : tri, recherche et regroupement, communs au menu et à la page Marques. */

export interface FavoriteBrand {
  slug: string;
  name: string;
}

/** Au-delà, la page Marques se découpe par lettre ; en dessous, des titres d'une marque gênent. */
export const LETTERS_FROM = 13;

/** Forme comparable : « Épée » et « epee » doivent se retrouver. */
function searchKey(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function sortBrands<T extends { name: string }>(brands: T[], locale: string): T[] {
  return [...brands].sort((a, b) =>
    a.name.localeCompare(b.name, locale, { sensitivity: "base", numeric: true }),
  );
}

/** Marques dont le nom contient la recherche ; celles qui commencent par elle passent devant. */
export function matchBrands<T extends { name: string }>(brands: T[], query: string): T[] {
  const needle = searchKey(query);
  if (!needle) return brands;
  const found = brands.filter((b) => searchKey(b.name).includes(needle));
  const starts = found.filter((b) => searchKey(b.name).startsWith(needle));
  return [...starts, ...found.filter((b) => !starts.includes(b))];
}

/** Sections par initiale, dans l'ordre reçu ; chiffres et symboles sous « # ». */
export function groupBrandsByLetter<T extends { name: string }>(
  brands: T[],
): { letter: string; brands: T[] }[] {
  const letters = new Map<string, T[]>();
  for (const brand of brands) {
    const initial = searchKey(brand.name).charAt(0).toUpperCase();
    const letter = /^[A-Z]$/.test(initial) ? initial : "#";
    letters.set(letter, [...(letters.get(letter) ?? []), brand]);
  }
  return [...letters].map(([letter, group]) => ({ letter, brands: group }));
}

/** Ajoute ou retire une favorite ; la plus récente reste à la fin, l'ordre ne saute pas. */
export function withFavorite(
  favorites: FavoriteBrand[],
  brand: FavoriteBrand,
  favorite: boolean,
): FavoriteBrand[] {
  const others = favorites.filter((f) => f.slug !== brand.slug);
  return favorite ? [...others, brand] : others;
}
