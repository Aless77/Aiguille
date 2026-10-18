import { type Metadata } from "next";

import { truncate } from "@/lib/catalog/format";

interface PageMetadataInput {
  title: string;
  description: string;
  /** Chemin canonique, sans paramètres (« /montres/tissot »). */
  path: string;
  /** false : page utile aux visiteurs mais sans valeur de recherche (contenu trop pauvre…). */
  index?: boolean;
  images?: string[];
}

/**
 * Métadonnées d'une page publique, conformes à docs/seo/checklist.md : titre unique, description
 * ≤ 155 caractères, canonique sans paramètres, Open Graph. L'indexation reste de toute façon
 * bloquée hors production par le layout racine.
 */
export function pageMetadata({
  title,
  description,
  path,
  index = true,
  images,
}: PageMetadataInput): Metadata {
  const desc = truncate(description);
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title, description: desc, url: path, ...(images?.length ? { images } : {}) },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}
