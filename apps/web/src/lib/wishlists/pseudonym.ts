import { createHmac } from "node:crypto";

/**
 * Pseudonyme d'un membre anonyme dans une liste : stable dans la discussion (on suit qui répond à
 * qui), différent d'une liste à l'autre (impossible de recouper deux listes) et impossible à
 * relier au compte sans le secret du serveur. Calculé côté serveur ; seul le pseudonyme sort.
 */

const OBJECTS = [
  "Balancier",
  "Spiral",
  "Rouage",
  "Barillet",
  "Remontoir",
  "Rubis",
  "Cadran",
  "Fermoir",
  "Pignon",
  "Ressort",
  "Échappement",
  "Tourbillon",
];
const COLORS = [
  "ambre",
  "azur",
  "bronze",
  "carmin",
  "émeraude",
  "graphite",
  "ivoire",
  "nacré",
  "olive",
  "saphir",
  "sable",
  "titane",
];

function secret(env: Record<string, string | undefined> = process.env): string {
  const value = env.BETTER_AUTH_SECRET;
  if (value) return value;
  // Sans secret (développement, CI) : pseudonymes stables mais non confidentiels.
  if (env.NODE_ENV === "production" && env.VERCEL_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET manquant : pseudonymes impossibles à protéger.");
  }
  return "aiguille-developpement";
}

export function pseudonym(
  wishlistId: number,
  userId: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const digest = createHmac("sha256", secret(env))
    .update(`pseudonyme:${wishlistId}:${userId}`)
    .digest();
  const object = OBJECTS[digest[0]! % OBJECTS.length]!;
  const color = COLORS[digest[1]! % COLORS.length]!;
  const number = (digest.readUInt16BE(2) % 90) + 10;
  return `${object} ${color} ${number}`;
}
