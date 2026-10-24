import { expect, test } from "@playwright/test";

test.describe("technique, garantie et entretien (lot 5)", () => {
  test("toute fiche présente ses faits techniques, sans note de goût", async ({ page }) => {
    await page.goto("/montres");
    const href = await page.getByLabel("Résultats").getByRole("link").first().getAttribute("href");
    await page.goto(href!);

    const section = page.locator("section#technique");
    await expect(
      section.getByRole("heading", { name: "Technique, garantie et entretien" }),
    ).toBeVisible();
    for (const group of ["Mouvement", "Construction", "Garantie et entretien"]) {
      await expect(section.getByRole("heading", { name: group, exact: true })).toBeVisible();
    }
    // Les informations absentes sont signalées, jamais inventées.
    await expect(section.getByText("Tarifs et délais de révision")).toBeVisible();
    await expect(section.getByText("Non communiqué par la marque").first()).toBeVisible();
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
