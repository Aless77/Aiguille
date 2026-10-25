"use client";

import { useEffect } from "react";

/**
 * Ouvre le bloc <details> visé par l'ancre de l'URL (lien « Gamme Master » d'une fiche vers
 * /montres/longines#gamme-master) : tous les navigateurs ne le déplient pas d'eux-mêmes.
 */
export function OpenDetailsOnHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (!(el instanceof HTMLDetailsElement)) return;
      // La gamme et le menu « Explorer les collections » qui la contient.
      for (let d: Element | null = el; d; d = d.parentElement?.closest("details") ?? null) {
        if (d instanceof HTMLDetailsElement) d.open = true;
      }
      el.scrollIntoView({ block: "start" });
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
