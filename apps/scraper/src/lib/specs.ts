import { type Listing } from "./listing.ts";
import { parseNumber } from "./text.ts";

type Movement = NonNullable<Listing["specs"]["movement"]>;

/**
 * Normalise le type de mouvement. L'ordre compte : « Mécanique à remontage automatique » est
 * automatique, et chez Hamilton « Mécanique » seul désigne un remontage manuel.
 */
export function parseMovement(value: string | undefined): Movement | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (/automati/.test(v)) return "automatique";
  if (/solaire|solar|eco-drive/.test(v)) return "solaire";
  if (/quartz|électronique|electronique/.test(v)) return "quartz";
  if (/manuel|manual|mécanique|mecanique/.test(v)) return "manuel";
  return "autre";
}

/**
 * Étanchéité en mètres. Les sources écrivent « jusqu'à 5 bar (50m) » ou
 * « 10 bar (100 m/330 ft) » : on privilégie les mètres, sinon bar × 10.
 */
export function parseWaterResistance(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const meters = value.match(/(\d+)\s*m(?![a-z])/i);
  if (meters?.[1]) return Number(meters[1]);
  const bar = value.match(/(\d+(?:[.,]\d+)?)\s*bar/i);
  if (bar?.[1]) return Math.round(Number(bar[1].replace(",", ".")) * 10);
  if (/atm/i.test(value)) {
    const atm = parseNumber(value);
    return atm === undefined ? undefined : Math.round(atm * 10);
  }
  return undefined;
}

/** Recherche insensible à la casse et aux accents d'un libellé parmi plusieurs variantes. */
export function pick(specs: Record<string, string>, ...labels: string[]): string | undefined {
  const normalize = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
  const wanted = labels.map(normalize);
  for (const [label, value] of Object.entries(specs)) {
    if (wanted.includes(normalize(label))) return value;
  }
  return undefined;
}
