/**
 * Configuration publique du site, partagée par les métadonnées, le sitemap et le JSON-LD.
 * Voir docs/seo/strategie.md pour les règles éditoriales.
 */
export const siteConfig = {
  name: "Aiguille",
  shortDescription: "Le comparateur de montres guidé par les données",
  description:
    "Historique des prix, disponibilité et caractéristiques des montres Tissot, Hamilton, Longines, Seiko et Citizen. Gratuit, indépendant et sans publicité.",
  locale: "fr_FR",
  language: "fr",
  repository: "https://github.com/Aless77/Aiguille",
} as const;

type Env = Record<string, string | undefined>;

/**
 * URL absolue du site, sans barre finale.
 * Ordre : variable explicite, domaine de production Vercel, URL du déploiement Vercel, localhost.
 */
export function getSiteUrl(env: Env = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Seule la production est indexable : les previews Vercel et le local ne doivent jamais
 * apparaître dans les moteurs (contenu dupliqué).
 */
export function isIndexable(env: Env = process.env): boolean {
  return env.VERCEL_ENV === "production";
}

/** Construit une URL absolue à partir d'un chemin (« /montres/tissot »). */
export function absoluteUrl(path = "/", env: Env = process.env): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl(env)}${normalized === "/" ? "" : normalized}`;
}
