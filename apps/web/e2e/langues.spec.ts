import { expect, test } from "@playwright/test";

// Build e2e : français, anglais et allemand publiés (LANGUAGES=fr,en,de, compose.yaml et CI).
const WATCH = "/montres/tissot/collection-test/test-0001";

test.describe("langues", () => {
  test("le français reste sans préfixe, /fr redirige vers l'URL canonique", async ({ page }) => {
    const response = await page.goto("/fr/montres");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/montres$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("une langue non publiée répond 404", async ({ page }) => {
    const response = await page.goto("/es/montres");
    expect(response?.status()).toBe(404);
  });

  test("le catalogue anglais garde la langue dans ses liens et n'est pas indexé", async ({
    page,
  }) => {
    await page.goto("/en/montres");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1, name: "All watches" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en\/montres$/);
    const href = await page.getByLabel("Results").getByRole("link").first().getAttribute("href");
    expect(href).toMatch(/^\/en\/montres\//);
  });

  test("la fiche allemande traduit l'interface et la fiche technique", async ({ page }) => {
    const response = await page.goto(`/de${WATCH}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Technische Daten" })).toBeVisible();
    await expect(page.locator("#fiche-boitier").getByText("Durchmesser")).toBeVisible();
    // Fiche sans version allemande publiée par la marque : avertissement de repli.
    await expect(page.locator("#technique [role=note]")).toBeVisible();
  });

  test("le sélecteur de langue ouvre la même page dans une autre langue", async ({ page }) => {
    await page.goto(WATCH);
    await page.getByRole("combobox", { name: "Langue" }).selectOption("en");
    await expect(page).toHaveURL(new RegExp(`/en${WATCH}$`));
    await expect(page.getByRole("heading", { name: "Specifications" })).toBeVisible();
  });
});
