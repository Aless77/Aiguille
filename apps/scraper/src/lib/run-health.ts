export interface ExtractionCounts {
  /** Fiches lues et rattachées à une montre du catalogue (ou montres officielles extraites). */
  matched: number;
  /** Offres de revendeur lues mais sans montre correspondante au catalogue. */
  unmatched: number;
}

/**
 * Message d'échec si l'exécution révèle une source cassée, sinon null.
 * - Rien d'extrait du tout : structure de page changée ou accès bloqué.
 * - Collecte complète d'un revendeur où tout est lu mais rien n'est rattaché : rapprochement par
 *   référence cassé. Avec `--limit`, quelques fiches hors catalogue sont normales (essai manuel).
 */
export function extractionFailure(counts: ExtractionCounts, limited: boolean): string | null {
  if (counts.matched + counts.unmatched === 0) {
    return "Zéro montre extraite : structure de la source changée ou accès bloqué.";
  }
  if (!limited && counts.matched === 0) {
    return `Aucune des ${counts.unmatched} offres lues n'a été rattachée au catalogue : rapprochement par référence à vérifier.`;
  }
  return null;
}
