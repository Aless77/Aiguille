import { expect, test, type Page } from "@playwright/test";

const header = (page: Page) => page.getByRole("banner");
const brandMenu = (page: Page) => header(page).getByRole("button", { name: "Marques" });

/** Compte simulé : session et marques épinglées répondues par le navigateur de test. */
async function signIn(page: Page, slugs: { slug: string; name: string }[]) {
  await page.route("**/api/auth/get-session*", (route) =>
    route.fulfill({
      json: {
        session: { id: "s", userId: "u", expiresAt: "2099-01-01T00:00:00.000Z" },
        user: { id: "u", name: "Test", email: "test@example.test" },
      },
    }),
  );
  await page.route("**/api/marques/favoris", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: { favorites: slugs } })
      : route.fulfill({ status: 204 }),
  );
}

test.describe("marques dans l'en-tête", () => {
  test("le menu remplace la liste des noms et la recherche mène à la marque", async ({ page }) => {
    await page.goto("/");
    await expect(header(page).getByRole("link", { name: "Tissot" })).toHaveCount(0);

    await brandMenu(page).click();
    const panel = page.getByRole("dialog", { name: "Marques" });
    const search = panel.getByRole("searchbox", { name: "Rechercher une marque" });
    await search.fill("tiss");
    await expect(panel.getByRole("link", { name: /Hamilton/ })).toHaveCount(0);
    await search.press("Enter");
    await expect(page).toHaveURL(/\/montres\/tissot$/);
    await expect(panel).toBeHidden();
  });

  test("une recherche sans résultat le dit", async ({ page }) => {
    await page.goto("/");
    await brandMenu(page).click();
    const panel = page.getByRole("dialog", { name: "Marques" });
    await panel.getByRole("searchbox").fill("marque inconnue");
    await expect(panel.getByRole("status")).toHaveText("Aucune marque pour « marque inconnue ».");
  });

  test("la page Marques liste chaque marque et reste reliée au pied de page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: "Marques" }).click();
    await expect(page).toHaveURL(/\/marques$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toutes les marques");
    await expect(page.locator('a[href="/montres/tissot"]').first()).toBeVisible();
  });

  test("épingler une marque est refusé sans compte", async ({ request }) => {
    const response = await request.put("/api/marques/favoris", {
      data: { brand: "tissot", favorite: true },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("marques épinglées", () => {
  test("elles s'affichent en accès direct, et l'étoile en ajoute une", async ({ page }) => {
    await signIn(page, [{ slug: "hamilton", name: "Hamilton" }]);
    await page.goto("/montres/tissot");

    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav.getByRole("link", { name: "Hamilton" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Tissot" })).toHaveCount(0);

    const pin = page.getByRole("button", { name: "Ajouter Tissot à mes marques" });
    const saved = page.waitForRequest(
      (r) => r.url().endsWith("/api/marques/favoris") && r.method() === "PUT",
    );
    await pin.click();
    expect((await saved).postDataJSON()).toEqual({ brand: "tissot", favorite: true });
    await expect(nav.getByRole("link", { name: "Tissot" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Retirer Tissot de mes marques" }).first(),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("le menu les place en tête, un refus du serveur annule l'étoile", async ({ page }) => {
    await signIn(page, [{ slug: "hamilton", name: "Hamilton" }]);
    await page.goto("/");
    await page.route("**/api/marques/favoris", (route) =>
      route.request().method() === "PUT"
        ? route.fulfill({ status: 500 })
        : route.fulfill({ json: { favorites: [{ slug: "hamilton", name: "Hamilton" }] } }),
    );

    await brandMenu(page).click();
    const panel = page.getByRole("dialog", { name: "Marques" });
    await expect(
      panel.getByRole("region", { name: "Mes marques" }).getByRole("link", { name: /Hamilton/ }),
    ).toBeVisible();

    await panel.getByRole("button", { name: "Retirer Hamilton de mes marques" }).first().click();
    await expect(
      panel.getByRole("region", { name: "Mes marques" }).getByRole("link", { name: /Hamilton/ }),
    ).toBeVisible();
  });
});
