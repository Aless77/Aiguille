import { expect, test } from "@playwright/test";

import { jsonLd } from "./helpers";

/** Montres fictives de packages/db/src/seed-e2e.ts : TEST-0001 a 3 avis, TEST-0002 aucun. */
const REVIEWED = "/montres/tissot/collection-test/test-0001";
const UNREVIEWED = "/montres/tissot/collection-test/test-0002";

test.describe("note sur 100 et avis (lot 5)", () => {
  test("toute fiche affiche la Note Aiguille, sa catégorie et ses 3 piliers", async ({ page }) => {
    await page.goto("/montres");
    const href = await page.getByLabel("Résultats").getByRole("link").first().getAttribute("href");
    await page.goto(href!);

    const section = page.locator("section#note");
    await expect(section.getByRole("heading", { name: "Note et avis" })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Note Aiguille" })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Avis de la communauté" })).toBeVisible();
    // « 88/100 », lu « Note : 88 sur 100 » par les lecteurs d'écran.
    await expect(section.getByText(/^Note : \d+\/100 sur 100$/)).toBeAttached();
    await expect(section.getByText(/Confiance (faible|moyenne|élevée) ·/).first()).toBeVisible();
    for (const pillar of ["Mouvement", "Construction", "Rapport qualité-prix"]) {
      // « Mouvement (45 %) » : libellé suivi de son poids.
      await expect(section.getByText(new RegExp(`^${pillar}\\s*\\(\\d+ %\\)$`))).toBeVisible();
    }
    // La note dit toujours à quelles montres elle compare la fiche.
    await expect(section.getByText(/des montres comparables/).first()).toBeVisible();
  });

  test("avis de la communauté, moyenne par critère et données structurées", async ({ page }) => {
    const response = await page.goto(REVIEWED);
    test.skip(response?.status() === 404, "Données e2e absentes (base locale réelle).");

    const section = page.locator("section#note");
    await expect(section.getByText("3 avis de visiteurs")).toBeVisible();
    await expect(section.getByText(/Confiance moyenne · Quelques avis/)).toBeVisible();
    await expect(section.getByText("Très belle finition, confortable au quotidien.")).toBeVisible();
    await expect(section.getByText("Testeur 3")).toBeVisible();
    await expect(section.getByText(/L'a essayée/)).toBeVisible();

    // Google : moyenne des avis sur 5 (4,3), jamais la Note Aiguille sur 100.
    const product = (await jsonLd(page)).find((d) => d["@type"] === "Product");
    expect(product).toMatchObject({
      aggregateRating: { ratingValue: 4.3, bestRating: 5, ratingCount: 3 },
    });
  });

  test("sans avis : invitation à se connecter", async ({ page }) => {
    const response = await page.goto(UNREVIEWED);
    test.skip(response?.status() === 404, "Données e2e absentes (base locale réelle).");

    const section = page.locator("section#note");
    await expect(section.getByText(/Pas encore d'avis sur cette montre/)).toBeVisible();
    await expect(
      section.getByRole("link", { name: "Se connecter pour donner mon avis" }),
    ).toHaveAttribute("href", `/connexion?retour=${encodeURIComponent(`${UNREVIEWED}#avis`)}`);
    const product = (await jsonLd(page)).find((d) => d["@type"] === "Product");
    expect(product).not.toHaveProperty("aggregateRating");
  });

  test("le catalogue se trie par Note Aiguille", async ({ page }) => {
    await page.goto("/montres?tri=note");
    const scores = await page
      .getByLabel("Résultats")
      .getByText(/^Note : $/)
      .evaluateAll((nodes) =>
        nodes.map((n) => Number(n.parentElement?.textContent?.match(/(\d+)/)?.[1])),
      );
    expect(scores.length).toBeGreaterThan(0);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  test("le dépôt d'un avis exige une connexion", async ({ request }) => {
    const response = await request.post("/api/avis", { data: { watchId: 1 } });
    expect(response.status()).toBe(401);
  });
});
