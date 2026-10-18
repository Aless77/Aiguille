import { describe, expect, it } from "vitest";

import { parseSitemapLocs } from "./sitemap.ts";

describe("parseSitemapLocs", () => {
  it("sépare pages et sitemaps enfants", () => {
    const index = `<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap><loc>https://x.test/sitemap_0.xml</loc></sitemap></sitemapindex>`;
    const urlset = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc> https://x.test/a.html </loc></url><url><loc>https://x.test/b.html</loc></url></urlset>`;

    expect(parseSitemapLocs(index)).toEqual({
      pages: [],
      sitemaps: ["https://x.test/sitemap_0.xml"],
    });
    expect(parseSitemapLocs(urlset)).toEqual({
      pages: ["https://x.test/a.html", "https://x.test/b.html"],
      sitemaps: [],
    });
  });
});
