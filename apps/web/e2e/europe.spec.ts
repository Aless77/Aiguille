import { expect, test } from "@playwright/test";

import { expectSeoBasics } from "./helpers";

/** Montre fictive avec prix suisse et allemand (packages/db/src/seed-e2e.ts). */
const WITH_COUNTRIES = "/montres/tissot/collection-test/test-0001";

test.describe("prix en Europe (lot 4)", () => {
  test("la fiche compare les prix nationaux convertis en euros", async ({ page }) => {
    const response = await page.goto(WITH_COUNTRIES);
    test.skip(response?.status() === 404, "Données e2e absentes (base locale réelle).");

    const section = page.getByRole("region", { name: "Prix en Europe" });
    await expect(section.getByText(/^Moins chère en Suisse/)).toBeVisible();
    // En-tête + Suisse, Allemagne, France, triés du moins cher au plus cher.
    await expect(section.getByRole("row")).toHaveCount(4);
    await expect(section.getByRole("row").nth(1)).toContainText("Suisse");
    await expect(section.getByRole("row").nth(1)).toContainText("CHF");
    await expect(section.locator('[aria-label^="Carte des écarts"] svg')).toBeVisible();
  });

  test("la page Prix en Europe est accessible depuis le pied de page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").locator('a[href="/prix-en-europe"]').click();
    await expect(page).toHaveURL(/\/prix-en-europe$/);
    await expectSeoBasics(page, "/prix-en-europe");
  });
});

test.describe("boutiques agréées (lot 4)", () => {
  test("la page Boutiques présente la carte et les marques", async ({ page }) => {
    await page.goto("/boutiques");
    await expectSeoBasics(page, "/boutiques");
    await expect(page.getByRole("region", { name: /Carte des boutiques agréées/ })).toBeVisible();
  });

  test("la page d'une marque permet de rechercher ses boutiques", async ({ page, request }) => {
    const res = await request.get("/boutiques/tissot");
    test.skip(res.status() === 404, "Pas de boutiques Tissot en base (données réelles).");

    await page.goto("/boutiques/tissot");
    await expectSeoBasics(page, "/boutiques/tissot");
    await page.getByRole("searchbox").fill("Lyon");
    await expect(page.getByText("Boutique de test Bellecour")).toBeVisible();
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  });

  test("la recherche filtre la carte et la liste, puis se réinitialise", async ({ page }) => {
    await page.goto("/boutiques");
    const results = page.getByRole("list", { name: "Résultats des boutiques" });
    const first = results.getByRole("listitem").first();
    const name = await first.getByRole("heading").innerText();
    const address = await first.locator("p").last().innerText();
    await page.getByRole("searchbox").fill(`${name} ${address}`);
    await expect(results.getByRole("listitem").first()).toContainText(address);
    const link = results.getByRole("link", { name: /Google Maps/ }).first();
    const url = new URL((await link.getAttribute("href"))!);
    expect(url.searchParams.get("query")).toBe(`${name}, ${address}`);
    expect(url.searchParams.get("api")).toBe("1");

    await page.getByRole("searchbox").fill("adresse-impossible-zzzz");
    await expect(page.getByRole("status")).toHaveText("0 boutique trouvée");
    await expect(page.getByText("Aucune boutique ne correspond", { exact: false })).toBeVisible();
    await expect(
      page.getByRole("region", { name: /Carte des boutiques agréées \(0 résultats/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Effacer la recherche" }).click();
    await expect(results.getByRole("listitem").first()).toBeVisible();
    await expect(page.getByRole("searchbox")).toHaveValue("");
  });

  test("la liste reste courte et la pagination remplace les résultats", async ({ page }) => {
    await page.goto("/boutiques");
    const results = page.getByRole("list", { name: "Résultats des boutiques" });
    await expect(results.getByRole("listitem")).not.toHaveCount(0);
    expect(await results.getByRole("listitem").count()).toBeLessThanOrEqual(6);
    const pagination = page.getByRole("navigation", { name: "Pages des boutiques" });
    test.skip(
      (await pagination.count()) === 0,
      "Au moins 7 boutiques nécessaires pour tester la pagination.",
    );
    const first = await results.getByRole("heading").first().innerText();
    await pagination.getByRole("button", { name: "Suivant" }).click();
    await expect(pagination).toContainText("Page 2 sur");
    await expect(results.getByRole("listitem")).toHaveCount(6);
    await expect(results.getByRole("heading").first()).not.toHaveText(first);
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: viewport.width, height: viewport.height - 80 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(pagination).toContainText("Page 2 sur");
    await pagination.getByRole("button", { name: "Précédent" }).click();
    await expect(results.getByRole("heading").first()).toHaveText(first);
    await page.getByRole("searchbox").fill("adresse-impossible-zzzz");
    await expect(pagination).toHaveCount(0);
  });

  test("le zoom adapte la liste à la zone visible et permet de revenir aux résultats", async ({
    page,
  }) => {
    await page.route("https://tiles.openfreemap.org/**", (route) =>
      route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
    );
    await page.goto("/boutiques");
    const range = page.getByText(/^Boutiques \d+ à \d+ sur/);
    const original = await range.innerText();
    const initialCount = Number(original.match(/sur (\d+)/)?.[1]);
    test.skip(initialCount < 7, "Plusieurs emplacements nécessaires pour tester la zone visible.");
    for (let index = 0; index < 4; index++)
      await page.getByRole("button", { name: "Zoomer", exact: true }).click();
    const reset = page.getByRole("button", { name: "Revenir à tous les résultats" });
    await expect(reset).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Boutiques dans la zone affichée" }),
    ).toBeVisible();
    await expect(async () => {
      const count = (await range.count())
        ? Number((await range.innerText()).match(/sur (\d+)/)?.[1])
        : 0;
      expect(count).toBeLessThan(initialCount);
    }).toPass();
    await reset.click();
    await expect(range).toHaveText(original);
    await expect(reset).toHaveCount(0);
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`la bulle est lisible et ouvre Google Maps en thème ${colorScheme}`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.emulateMedia({ colorScheme });
      // Le fond distant ne fait pas partie du parcours : carte minimale pour un test reproductible.
      await page.route("https://tiles.openfreemap.org/**", (route) =>
        route.fulfill({
          json: {
            version: 8,
            sources: {},
            layers: [
              {
                id: "background",
                type: "background",
                paint: { "background-color": colorScheme === "dark" ? "#222222" : "#eeeeee" },
              },
            ],
          },
        }),
      );
      await page.goto("/boutiques");
      const first = page
        .getByRole("list", { name: "Résultats des boutiques" })
        .getByRole("listitem")
        .first();
      const name = await first.getByRole("heading").innerText();
      const address = await first.locator("p").last().innerText();
      await page.getByRole("searchbox").fill(`${name} ${address}`);
      const canvas = page.locator(".maplibregl-canvas");
      await expect(canvas).toBeVisible();
      // Un seul emplacement : le cadrage place son point au centre de la carte.
      const popup = page.locator(".store-popup .maplibregl-popup-content");
      await expect(async () => {
        const box = await canvas.boundingBox();
        expect(box).not.toBeNull();
        await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
        await expect(popup).toBeVisible({ timeout: 1000 });
      }).toPass();
      await expect(popup).toContainText(name);
      await expect(popup).toContainText("Stock non garanti");
      await expect(popup.getByRole("link", { name: /Google Maps/ })).toHaveAttribute(
        "href",
        /https:\/\/www.google.com\/maps\/search\/\?api=1/,
      );
      const colors = await popup.evaluate((element) => {
        const style = getComputedStyle(element);
        const reference = document.createElement("div");
        reference.style.color = "var(--popover-foreground)";
        reference.style.background = "var(--popover)";
        element.append(reference);
        const expected = getComputedStyle(reference);
        const result = {
          text: style.color,
          background: style.backgroundColor,
          expectedText: expected.color,
          expectedBackground: expected.backgroundColor,
        };
        reference.remove();
        return result;
      });
      expect(colors.text).toBe(colors.expectedText);
      expect(colors.background).toBe(colors.expectedBackground);
      expect(colors.text).not.toBe(colors.background);
      await expect(async () => {
        const frame = await canvas.boundingBox();
        const bubble = await popup.boundingBox();
        expect(frame).not.toBeNull();
        expect(bubble).not.toBeNull();
        expect(bubble!.y).toBeGreaterThanOrEqual(frame!.y);
        expect(bubble!.y + bubble!.height).toBeLessThanOrEqual(frame!.y + frame!.height);
      }).toPass();
      expect(errors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`boutique-${colorScheme}.png`) });
    });
  }

  test("une marque sans boutiques renvoie un vrai 404", async ({ page }) => {
    const response = await page.goto("/boutiques/marque-inexistante");
    expect(response?.status()).toBe(404);
  });
});
