import { expect, test } from "@playwright/test";

import { expectSeoBasics, jsonLd } from "./helpers";

test.describe("accueil", () => {
  test("présente le site et mène au catalogue", async ({ page }) => {
    await page.goto("/");
    await expectSeoBasics(page, "/");
    const types = (await jsonLd(page)).map((d) => d["@type"]);
    expect(types).toEqual(expect.arrayContaining(["WebSite", "Organization"]));

    await page.getByRole("link", { name: /Parcourir les \d+ montres/ }).click();
    await expect(page).toHaveURL(/\/montres$/);
  });
});

test.describe("catalogue", () => {
  test("fournit le verrou Dark Reader avant les icônes, même avec le HTML diffusé", async ({
    request,
  }) => {
    const response = await request.get("/montres", {
      // Un navigateur ordinaire reçoit les métadonnées diffusées ; un robot pourrait masquer
      // la régression en forçant Next.js à les attendre avant de servir la page.
      headers: { "user-agent": "Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36" },
    });
    expect(response.ok()).toBe(true);
    const html = await response.text();
    const lock = html.indexOf('name="darkreader-lock"');
    expect(lock).toBeGreaterThan(-1);
    expect(lock).toBeLessThan(html.indexOf("</head>"));
    expect(lock).toBeLessThan(html.indexOf("<svg"));
  });

  test("liste des montres, canonique sans paramètres", async ({ page }) => {
    await page.goto("/montres?tri=prix-desc");
    await expectSeoBasics(page, "/montres");
    await expect(page.getByLabel("Résultats").locator("h3").first()).toBeVisible();
  });

  test("les filtres modifient l'URL et la liste", async ({ page, isMobile }) => {
    await page.goto("/montres");
    // Attendre l'hydratation : un clic avant ne déclenche pas les filtres (composant client).
    await page.waitForLoadState("load");
    // :visible : pendant la transition, React garde l'ancienne liste masquée dans le DOM.
    const countText = page.locator('[aria-label="Résultats"]:visible').getByText(/^\d+ montres?/);
    const before = await countText.textContent();

    if (isMobile) await page.getByRole("button", { name: /Filtres/ }).click();
    await page.getByRole("group", { name: "Mouvement" }).locator("label").first().click();

    await expect(page).toHaveURL(/mouvement=/);
    await expect(countText).not.toHaveText(before ?? "");
  });
});

test.describe("fiche montre", () => {
  test("contenu, SEO et données structurées", async ({ page }) => {
    await page.goto("/montres");
    const card = page.getByLabel("Résultats").getByRole("link").first();
    const href = await card.getAttribute("href");
    expect(href).toMatch(/^\/montres\/[^/]+\/[^/]+\/[^/]+$/);

    await page.goto(href!);
    await expectSeoBasics(page, href!);
    await expect(page.getByText("Prix catalogue officiel", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fiche technique" })).toBeVisible();

    const data = await jsonLd(page);
    const product = data.find((d) => d["@type"] === "Product");
    expect(product).toMatchObject({ sku: expect.any(String), brand: { "@type": "Brand" } });
    const breadcrumb = data.find((d) => d["@type"] === "BreadcrumbList") as
      { itemListElement: unknown[] } | undefined;
    expect(breadcrumb?.itemListElement.length).toBe(5);
  });

  // Vrai statut 404 (et non une page 200 « soft 404 ») pour toute URL inconnue, à chaque niveau.
  for (const path of [
    "/montres/marque-inexistante",
    "/montres/tissot/collection-inexistante",
    "/montres/tissot/prx/reference-inexistante",
  ]) {
    test(`${path} renvoie un vrai 404`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    });
  }
});

test.describe("pages de confiance", () => {
  for (const path of ["/methodologie", "/a-propos"]) {
    test(`${path} est accessible depuis le pied de page`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("contentinfo").locator(`a[href="${path}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expectSeoBasics(page, path);
    });
  }
});

test.describe("fichiers pour les moteurs", () => {
  test("robots.txt bloque tout hors production", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/Disallow: \/\s*$/m);
  });

  test("le sitemap liste des fiches montres", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    expect(body).toMatch(/<loc>[^<]+\/montres\/[^/<]+\/[^/<]+\/[^/<]+<\/loc>/);
  });
});

test.describe("langues", () => {
  test("le français reste sans préfixe, /fr redirige vers l'URL canonique", async ({ page }) => {
    const response = await page.goto("/fr/montres");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/montres$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("une langue non publiée répond 404", async ({ page }) => {
    // LANGUAGES n'est pas défini pour les tests : seul le français est publié.
    const response = await page.goto("/en/montres");
    expect(response?.status()).toBe(404);
  });
});
