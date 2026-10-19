import { expect, type Page } from "@playwright/test";

/** Tous les objets JSON-LD de la page, tableaux dépliés. */
export async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((b) => {
    const data = JSON.parse(b) as unknown;
    return (Array.isArray(data) ? data : [data]) as Record<string, unknown>[];
  });
}

/** Exigences communes de la checklist SEO pour une page publique indexable. */
export async function expectSeoBasics(page: Page, canonicalPath: string) {
  // :visible : après une navigation client, Next garde la page précédente masquée dans le DOM.
  await expect(page.locator("h1:visible")).toHaveCount(1);

  const title = await page.title();
  expect(title.length).toBeGreaterThan(10);

  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description?.length ?? 0).toBeGreaterThan(50);
  expect(description?.length ?? 0).toBeLessThanOrEqual(160);

  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(new URL(canonical ?? "").pathname.replace(/\/$/, "") || "/").toBe(canonicalPath);

  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
}
