/** Nom de fichier sans paramètres : une même photo revient souvent sous plusieurs adresses. */
function fileName(url: string): string {
  return url.split("?")[0]!.split("/").at(-1)!.toLowerCase();
}

/** Photos sans doublon, dans l'ordre reçu : la photo principale reste la première. */
export function uniqueImages(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    const file = fileName(url);
    if (seen.has(file)) return false;
    seen.add(file);
    return true;
  });
}

/** Adresses d'images trouvées dans le HTML, y compris dans les données de la page. */
export function imagesInHtml(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map((match) => match[0]);
}

/** Rang publié dans le nom (« -detailed-view-…-3-8c577e.jpg », « -portrait-10-… ») ; sinon à la fin. */
export function byImageRank(rank: (url: string) => string | undefined) {
  const value = (url: string) => Number(rank(url) ?? Number.MAX_SAFE_INTEGER);
  return (a: string, b: string) => value(a) - value(b);
}
