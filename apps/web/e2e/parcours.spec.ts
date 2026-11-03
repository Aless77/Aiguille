import { expect, test } from "@playwright/test";

test.describe("feuilletage depuis une fiche", () => {
  test("Suivant et Précédent suivent la liste filtrée, puis retour aux résultats", async ({
    page,
  }) => {
    await page.goto("/montres?tri=prix-desc");
    const results = page.getByLabel("Résultats");
    const links = results.getByRole("link");
    const first = await links.nth(0).getAttribute("href");
    const second = await links.nth(1).getAttribute("href");
    expect(first).not.toEqual(second);

    await links.nth(0).click();
    await expect(page).toHaveURL(new RegExp(`${first}$`));
    const trail = page.getByRole("navigation", { name: "Parcourir les résultats" });
    await expect(trail.getByText(/^Montre 1 sur \d+$/)).toBeVisible();

    await trail.getByRole("link", { name: "Suivant" }).click();
    await expect(page).toHaveURL(new RegExp(`${second}$`));
    await expect(trail.getByText(/^Montre 2 sur \d+$/)).toBeVisible();

    await trail.getByRole("link", { name: "Précédent" }).click();
    await expect(page).toHaveURL(new RegExp(`${first}$`));

    await trail.getByRole("link", { name: "Retour aux résultats" }).click();
    await expect(page).toHaveURL(/\/montres\?tri=prix-desc$/);
  });

  test("les flèches du clavier feuillettent", async ({ page, isMobile }) => {
    test.skip(isMobile, "Pas de clavier sur mobile.");
    await page.goto("/montres?tri=prix-desc");
    const links = page.getByLabel("Résultats").getByRole("link");
    const second = await links.nth(1).getAttribute("href");
    await links.nth(0).click();
    const trail = page.getByRole("navigation", { name: "Parcourir les résultats" });
    await expect(trail.getByText(/^Montre 1 sur/)).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(new RegExp(`${second}$`));
  });

  test("une fiche ouverte directement n'affiche pas de parcours", async ({ page }) => {
    await page.goto("/montres/tissot/collection-test/test-0001");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Parcourir les résultats" })).toHaveCount(0);
  });
});
