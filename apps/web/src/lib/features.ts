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
 * - FEATURE_COMMUNITY : listes de souhaits, partage et page Communauté. **Affichées par défaut** :
 *   masquées seulement avec « false » (les listes existantes restent en base).
 */
export const features = {
  score: (env: Env = process.env) => isTrue(env.FEATURE_SCORE),
  reviews: (env: Env = process.env) => !isFalse(env.FEATURE_REVIEWS),
  community: (env: Env = process.env) => !isFalse(env.FEATURE_COMMUNITY),
  /** Un compte sert aux avis, aux listes et aux marques épinglées : fermé si les deux sont masqués. */
  accounts: (env: Env = process.env) => features.reviews(env) || features.community(env),
};
