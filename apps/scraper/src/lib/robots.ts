import robotsParser from "robots-parser";

import { ROBOTS_USER_AGENT, USER_AGENT } from "../config.ts";

export interface RobotsRules {
  isAllowed(url: string): boolean;
  /** Délai demandé par le site (Crawl-delay), en secondes. */
  crawlDelaySecs?: number;
}

/** Analyse un robots.txt pour notre robot. Une URL non couverte par les règles est autorisée. */
export function parseRobots(robotsUrl: string, content: string): RobotsRules {
  const robots = robotsParser(robotsUrl, content);
  return {
    isAllowed: (url) => robots.isAllowed(url, ROBOTS_USER_AGENT) !== false,
    crawlDelaySecs: robots.getCrawlDelay(ROBOTS_USER_AGENT),
  };
}

/**
 * Télécharge le robots.txt d'un site avec notre User-Agent. Crawlee le fait aussi, mais avec un
 * User-Agent de navigateur, contraire à nos règles de collecte : on garde donc la main.
 * Robots.txt absent (404) : tout est autorisé. Autre erreur : on s'abstient par prudence.
 */
export async function fetchRobots(siteUrl: string): Promise<RobotsRules> {
  const robotsUrl = new URL("/robots.txt", siteUrl).toString();
  const response = await fetch(robotsUrl, { headers: { "user-agent": USER_AGENT } });
  if (response.status === 404) return parseRobots(robotsUrl, "");
  if (!response.ok)
    throw new Error(`robots.txt illisible (${robotsUrl} : HTTP ${response.status})`);
  return parseRobots(robotsUrl, await response.text());
}
