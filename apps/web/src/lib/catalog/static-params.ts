/**
 * Avec Cache Components, generateStaticParams doit renvoyer au moins un jeu de paramètres
 * (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md).
 * Base vide (CI, premier déploiement) : on renvoie un paramètre factice, que la page traite par
 * notFound().
 */
export const PLACEHOLDER_SLUG = "__aucun__";

export function withPlaceholder<T extends Record<string, string>>(
  params: T[],
  placeholder: T,
): T[] {
  return params.length > 0 ? params : [placeholder];
}
