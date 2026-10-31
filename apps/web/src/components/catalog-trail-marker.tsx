"use client";

import { useEffect } from "react";

import { saveTrail } from "@/lib/catalog/trail-store";
import { splitLocale } from "@/lib/i18n/config";

/** Retient la liste affichée : c'est elle que Précédent et Suivant parcourront depuis une fiche. */
export function CatalogTrailMarker({
  paths,
  offset,
  total,
}: {
  paths: string[];
  offset: number;
  total: number;
}) {
  useEffect(() => {
    const { pathname, search } = window.location;
    saveTrail({ list: `${splitLocale(pathname).path}${search}`, offset, paths, total });
  }, [paths, offset, total]);
  return null;
}
