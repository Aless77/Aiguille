import { expect, test } from "@playwright/test";

test.describe("fiche technique commune (lot 5)", () => {
  for (const brand of ["tissot", "hamilton", "longines"]) {
    test(`garantie et entretien sourcés pour ${brand}`, async ({ page }) => {
      await page.goto(`/montres?marque=${brand}`);
      const href = await page
        .getByLabel("Résultats")
        .getByRole("link")
        .first()
        .getAttribute("href");
      await page.goto(href!);
      const section = page.locator("section#technique");
      await section
        .getByRole("navigation")
        .getByRole("link", { name: "Garantie et entretien", exact: true })
        .click();
      await expect(page).toHaveURL(/#fiche-garantie$/);
      const warranty = section.locator("#fiche-garantie");
      await expect(warranty.getByRole("link", { name: /Détail de la garantie/ })).toHaveAttribute(
        "href",
        new RegExp(brand),
      );
      await expect(warranty.getByRole("link", { name: /Tarifs de la marque/ })).toHaveAttribute(
        "href",
        new RegExp(brand),
      );
      await expect(
        warranty.getByText(/Prix conseillé par la marque en France, relevé le/),
      ).toBeVisible();
    });
  }

  test("toute fiche présente les mêmes rubriques, sans note de goût", async ({ page }) => {
    await page.goto("/montres");
    const href = await page.getByLabel("Résultats").getByRole("link").first().getAttribute("href");
    await page.goto(href!);

    const section = page.locator("section#technique");
    await expect(section.getByRole("heading", { name: "Fiche technique" })).toBeVisible();
    const groups = ["Mouvement", "Boîtier", "Cadran", "Bracelet", "Garantie et entretien"];
    for (const group of groups) {
      await expect(section.getByRole("heading", { name: group, exact: true })).toBeVisible();
      // Raccourci vers chaque rubrique.
      await expect(
        section.getByRole("navigation").getByRole("link", { name: group, exact: true }),
      ).toHaveAttribute("href", /#fiche-/);
    }
    // Les informations absentes sont signalées, jamais inventées.
    await expect(section.getByText("Révision complète", { exact: true })).toBeVisible();
    await expect(section.getByRole("link", { name: /Détail de la garantie/ })).toHaveAttribute(
      "href",
      /^https:\/\//,
    );
    await expect(section.getByRole("link", { name: /Tarifs de la marque/ })).toHaveAttribute(
      "href",
      /^https:\/\//,
    );
    await expect(section.getByText("Non communiqué").first()).toBeVisible();
  });

  test("la méthodologie explique la comparaison technique", async ({ page }) => {
    await page.goto("/methodologie");
    await expect(
      page.getByRole("heading", { name: "Technique, garantie et entretien" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Aussi bien équipées, pour moins cher" }),
    ).toBeVisible();
  });
});
