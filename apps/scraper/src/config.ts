/**
 * Règles de collecte du cahier des charges (voir docs/sources.md) :
 * User-Agent identifiable, rythme lent, respect de robots.txt.
 */
export const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ?? "AiguilleBot/0.1 (+https://github.com/Aless77/Aiguille)";

/** Jeton comparé aux groupes `User-agent:` des robots.txt. */
export const ROBOTS_USER_AGENT = "AiguilleBot";

/** Délai minimal entre deux requêtes vers un même domaine. */
export const DOMAIN_DELAY_SECS = 4;
