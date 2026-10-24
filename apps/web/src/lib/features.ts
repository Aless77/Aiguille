type Env = Record<string, string | undefined>;

const isTrue = (value: string | undefined) => value === "true" || value === "1";
const isFalse = (value: string | undefined) => value === "false" || value === "0";

/**
 * Interrupteurs d'affichage (docs/decisions.md, 24 octobre 2026). Le code et les calculs restent
 * en place ; seul l'affichage public dépend de ces variables, lues au build (pages prérendues :
 * un changement prend effet au prochain déploiement).
 *
 * - FEATURE_SCORE : Note Aiguille sur 100 (fiche, cartes, tri, méthodologie). **Masquée par
 *   défaut** : affichée seulement avec « true ».
 * - FEATURE_REVIEWS : avis de la communauté (fiche, formulaire, API, données structurées) et
 *   lien de connexion. **Affichés par défaut**, même sans la variable : masqués seulement avec
 *   « false ».
 */
export const features = {
  score: (env: Env = process.env) => isTrue(env.FEATURE_SCORE),
  reviews: (env: Env = process.env) => !isFalse(env.FEATURE_REVIEWS),
};
