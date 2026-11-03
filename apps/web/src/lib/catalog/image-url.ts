/** Largeur de la photo principale de la fiche. */
export const GALLERY_WIDTH = 800;
/** Largeur du zoom : au-delà, certains originaux Omega dépassent 10 Mo. */
export const ZOOM_WIDTH = 2000;

/** Plus petite taille publiée suffisante, ou `undefined` au-delà de la plus grande. */
const atLeast = (width: number, sizes: number[]) => sizes.find((size) => size >= width);

/**
 * Adresse d'une photo à la largeur voulue, pour les sites qui savent la redimensionner : les images
 * sont servies telles quelles depuis les marques. Longines, Seiko et Tissot répondent en moins
 * d'une seconde aux tailles de leurs propres pages, et en 3 à 5 s aux autres (mesuré le 1er
 * novembre 2026) : la demande est calée sur ces tailles. Sans règle, l'adresse reste inchangée.
 */
export function sizedImage(src: string, width: number): string {
  const base = src.split("?")[0]!;
  if (src.includes("//www.omegawatches.com/media/")) return `${base}?w=${width}`;
  if (src.includes("//api.ecom.longines.com/media/")) {
    const size = atLeast(width, [256, 512, 828]);
    return size ? `${base}?w=${size}` : base;
  }
  if (/\/\/www\.(?:seikowatches|grand-seiko)\.com\/.*\/-\/media\//.test(src)) {
    const size = width <= 500 ? 300 : 1200;
    return `${base}?mh=${size}&mw=${size}`;
  }
  if (src.includes("//www.tissotwatches.com/on/demandware.static/")) {
    const size = atLeast(width, [150, 300, 450, 800]);
    return size
      ? `${base.replace("/on/demandware.static/", "/dw/image/v2/BKKD_PRD/on/demandware.static/")}?sm=fit&sw=${size}&sh=${size}`
      : base;
  }
  // Formats publiés par Lepage : 450 et 800 px, ou 2 200 px pour zoom_default.
  if (src.includes("-zoom_default/")) {
    if (width <= 450) return src.replace("-zoom_default/", "-home_default/");
    if (width <= 800) return src.replace("-zoom_default/", "-large_default/");
  }
  return src;
}
