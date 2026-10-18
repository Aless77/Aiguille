import { describe, expect, it } from "vitest";

import { parseRobots } from "./robots.ts";

const ROBOTS = "https://x.test/robots.txt";

describe("parseRobots", () => {
  it("applique les règles génériques", () => {
    const rules = parseRobots(ROBOTS, "User-agent: *\nDisallow: /*?\nDisallow: */checkout/\n");
    expect(rules.isAllowed("https://x.test/fr-fr/h69409930-khaki-field.html")).toBe(true);
    expect(rules.isAllowed("https://x.test/fr-fr/montres.html?dir=asc")).toBe(false);
    expect(rules.isAllowed("https://x.test/fr-fr/checkout/cart")).toBe(false);
  });

  it("applique un groupe qui nous vise nommément et lit Crawl-delay", () => {
    const rules = parseRobots(
      ROBOTS,
      "User-agent: *\nAllow: /\n\nUser-agent: AiguilleBot\nDisallow: /prive/\nCrawl-delay: 10\n",
    );
    expect(rules.isAllowed("https://x.test/prive/a")).toBe(false);
    expect(rules.isAllowed("https://x.test/public")).toBe(true);
    expect(rules.crawlDelaySecs).toBe(10);
  });

  it("autorise tout avec un robots.txt vide", () => {
    expect(parseRobots(ROBOTS, "").isAllowed("https://x.test/a")).toBe(true);
  });
});
