import { expect, test } from "@playwright/test";

import { expectSeoBasics, jsonLd } from "./helpers";

/** Montres fictives de packages/db/src/seed-e2e.ts (présentes en CI, absentes en local). */
const WITH_HISTORY = "/montres/tissot/collection-test/test-0001";
const NEW_WATCH = "/montres/tissot/collection-test/test-0003";

test.describe("historique des prix (lot 3)", () => {
  test("toute fiche affiche son historique et son statut de stock", async ({ page }) => {
    await page.goto("/montres");
    const href = await page.getByLabel("Résultats").getByRole("link").first().getAttribute("href");
    await page.goto(href!);

    await expect(page.getByRole("heading", { name: "Historique des prix" })).toBeVisible();
    // Résumé en texte dans le HTML serveur (lisible par les moteurs), pas seulement la courbe.
    await expect(page.getByText(/depuis (notre premier relevé du|le) \d+/)).toBeVisible();
    await expect(
      page.getByText(/(En stock|Rupture de stock|En précommande) sur le site/),
    ).toBeVisible();
  });

  test("courbe, plus bas et plus haut sur une montre suivie depuis un mois", async ({ page }) => {
    const response = await page.goto(WITH_HISTORY);
    test.skip(response?.status() === 404, "Données e2e absentes (base locale réelle).");

    // Le plus bas vient de l'offre Lepage (760 €), le plus haut du premier prix officiel.
    await expect(page.getByText(/le prix le plus bas relevé est\s*760/)).toBeVisible();
    await expect(page.getByText(/le plus haut\s*795/)).toBeVisible();
    await expect(page.getByRole("img", { name: /Graphique de l'évolution du prix/ })).toBeVisible();
    await expect(page.locator('[role="img"] svg')).toBeVisible();

    const product = (await jsonLd(page)).find((d) => d["@type"] === "Product");
    expect(product).toMatchObject({ offers: { availability: "https://schema.org/InStock" } });
  });
});

test.describe("offres des revendeurs (lot 3)", () => {
  test("tableau des offres, meilleur prix et JSON-LD agrégé", async ({ page }) => {
    const response = await page.goto(WITH_HISTORY);
    test.skip(response?.status() === 404, "Données e2e absentes (base locale réelle).");

    const offers = page.getByRole("region", { name: "Où la trouver" });
    await expect(offers.getByRole("row")).toHaveCount(4); // en-tête + 3 vendeurs
    // Disponibles d'abord, du moins cher au plus cher.
    await expect(offers.getByRole("row").nth(1)).toContainText("Lepage");
    await expect(offers.getByRole("link", { name: /Voir l'offre chez Lepage/ })).toHaveAttribute(
      "rel",
      /nofollow/,
    );
    await expect(page.getByText(/Meilleur prix relevé :\s*760\s*€ chez Lepage/)).toBeVisible();

    const product = (await jsonLd(page)).find((d) => d["@type"] === "Product");
    expect(product).toMatchObject({
      offers: { lowPrice: 760, highPrice: 775, offerCount: 3 },
    });
  });
});

test.describe("nouveautés (lot 3)", () => {
  test("la page est accessible depuis l'en-tête", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Nouveautés" })
      .click();
    await expect(page).toHaveURL(/\/nouveautes$/);
    await expect(page.locator("h1:visible")).toHaveText("Nouveautés");
  });

  test("une référence apparue récemment y figure, l'import initial non", async ({ page }) => {
    const fixture = await page.request.get(NEW_WATCH);
    test.skip(fixture.status() === 404, "Données e2e absentes (base locale réelle).");

    await page.goto("/nouveautes");
    await expectSeoBasics(page, "/nouveautes");
    await expect(page.locator(`a[href="${NEW_WATCH}"]`)).toBeVisible();
    await expect(page.locator(`a[href="${WITH_HISTORY}"]`)).toHaveCount(0);
  });
});
