/** Transforme un libellé en slug d'URL : minuscules, sans accents, mots séparés par des tirets. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Référence sans séparateurs, en majuscules : « T137.407.11.041.00 » → « T1374071104100 ». */
export function referenceKey(reference: string): string {
  return reference.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Nom en capitales (« LONGINES SPIRIT PILOT ») → « Longines Spirit Pilot ». Les sigles et les mots
 * contenant un chiffre ou un point (GMT, V.H.P., L3) restent tels quels.
 */
export function titleCase(value: string): string {
  return cleanText(value)
    .split(" ")
    .map((word) =>
      /\d|\./.test(word) || /^(GMT|VHP|UTC)$/i.test(word)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

/** Espaces normalisés (y compris insécables), bords retirés. */
export function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Premier nombre d'une chaîne, virgule décimale acceptée : « 40,00 » → 40, « 38mm » → 38. */
export function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/);
  if (!match) return undefined;
  const n = Number(match[0].replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/** Prix décimal (« 775.00 », 695) en centimes entiers. */
export function toCents(price: string | number | undefined): number | undefined {
  if (price === undefined || price === "") return undefined;
  const n = typeof price === "number" ? price : parseNumber(String(price));
  return n === undefined ? undefined : Math.round(n * 100);
}
