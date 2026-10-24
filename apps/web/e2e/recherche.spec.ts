import { expect, test, type Page } from "@playwright/test";

const results = (page: Page) => page.locator('[aria-label="Résultats"]:visible');

for (const scope of ["catalogue", "marque", "collection"] as const) {
  test(`recherche par référence dans ${scope}, sans quitter son périmètre`, async ({ page }) => {
    await page.goto("/montres?marque=tissot");
    const card = results(page).getByRole("link").first();
    const href = (await card.getAttribute("href"))!;
    const reference = (await card.locator("p").first().innerText())
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
    const path =
      scope === "catalogue"
        ? "/montres"
        : scope === "marque"
          ? "/montres/tissot"
          : href.split("/").slice(0, 4).join("/");
    await page.goto(path);
    await page.getByRole("searchbox", { name: "Rechercher une montre" }).fill(reference);
    await expect(page).toHaveURL(/recherche=/);
    await expect(results(page).getByRole("link", { name: /./ })).toHaveCount(1);
    await expect(results(page).getByRole("link").first()).toHaveAttribute("href", href);
    expect(new URL(page.url()).pathname).toBe(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`${path}$`),
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.reload();
    await expect(page.getByRole("searchbox")).toHaveValue(reference);
    await expect(results(page).getByRole("link").first()).toHaveAttribute("href", href);
  });
}

test("recherche par nom et message sans résultat", async ({ page }) => {
  await page.goto("/montres");
  await page.getByRole("searchbox").fill("tissot");
  await expect(page).toHaveURL(/recherche=tissot/);
  await expect(results(page).getByRole("link").first()).toHaveAttribute(
    "href",
    /^\/montres\/tissot\//,
  );
  await page.getByRole("searchbox").fill("reference-vraiment-introuvable");
  await expect(results(page).getByText(/Aucune montre ne correspond/)).toBeVisible();
});

test("prix et diamètre : curseurs au clavier, saisie précise et remise à zéro", async ({
  page,
  isMobile,
}) => {
  await page.goto("/montres/tissot");
  if (isMobile) await page.getByRole("button", { name: /Filtres/ }).click();
  const maximum = page.getByRole("slider", { name: "Prix maximum en euros", exact: true });
  await maximum.focus();
  await maximum.press("ArrowLeft");
  await expect(page).toHaveURL(/prixMax=/);
  const diameter = page.getByRole("slider", {
    name: "Diamètre minimum en millimètres",
    exact: true,
  });
  await diameter.focus();
  await diameter.press("ArrowRight");
  await expect(page).toHaveURL(/diametreMin=/);
  await page.getByRole("spinbutton", { name: "Prix maximum en euros", exact: true }).fill("0");
  await page.getByRole("spinbutton", { name: "Prix maximum en euros", exact: true }).press("Enter");
  await expect(page).toHaveURL(/prixMax=0/);
  await expect(results(page).getByText(/Aucune montre ne correspond/)).toBeVisible();
  await page.getByRole("button", { name: "Effacer les filtres" }).click();
  await expect(page).toHaveURL(/\/montres\/tissot$/);
  await expect(results(page).getByRole("link").first()).toBeVisible();
});
