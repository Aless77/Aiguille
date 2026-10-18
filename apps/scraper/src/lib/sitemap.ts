import { load } from "cheerio";

import { USER_AGENT } from "../config.ts";

/** Toutes les balises <loc> d'un sitemap ou d'un index de sitemaps. */
export function parseSitemapLocs(xml: string): { pages: string[]; sitemaps: string[] } {
  const $ = load(xml, { xmlMode: true });
  const locs = (selector: string) =>
    $(selector)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);
  return { pages: locs("url > loc"), sitemaps: locs("sitemap > loc") };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Récupère les URL de pages d'un sitemap, en suivant les index (un niveau par appel récursif),
 * avec notre User-Agent et une pause entre les fichiers.
 * `followSitemap` permet de ne pas télécharger les sitemaps inutiles (autres langues…).
 */
export async function fetchSitemapPages(
  url: string,
  followSitemap: (url: string) => boolean = () => true,
  delayMs = 2000,
): Promise<string[]> {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Sitemap ${url} : HTTP ${response.status}`);
  const { pages, sitemaps } = parseSitemapLocs(await response.text());

  const result = [...pages];
  for (const child of sitemaps.filter(followSitemap)) {
    await sleep(delayMs);
    result.push(...(await fetchSitemapPages(child, followSitemap, delayMs)));
  }
  return [...new Set(result)];
}
