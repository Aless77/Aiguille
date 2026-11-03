import { expect, type Page, test } from "@playwright/test";

/** Première fiche du catalogue ; la galerie complète exige plusieurs photos. */
async function openGallery(page: Page) {
  await page.goto("/montres");
  await page.getByLabel("Résultats").getByRole("link").first().click();
  const gallery = page.getByRole("list", { name: "Photos de la montre" });
  test.skip(
    !(await gallery.isVisible().catch(() => false)),
    "Aucune montre à plusieurs photos dans cette base.",
  );
  return gallery;
}

test.describe("galerie de la fiche", () => {
  test("les miniatures et les flèches changent la photo sans quitter la fiche", async ({
    page,
  }) => {
    const gallery = await openGallery(page);
    const url = page.url();
    await page.getByRole("button", { name: "Photo suivante" }).click();
    await expect(gallery.getByRole("button", { name: /Photo 2 sur/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL(url);
  });

  test("le plein écran s'ouvre, zoome et se ferme", async ({ page }) => {
    await openGallery(page);
    await page.getByRole("button", { name: "Agrandir la photo" }).click();
    const dialog = page.getByRole("dialog", { name: "Photos de la montre" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Zoomer", exact: true }).click();
    await expect(dialog.getByRole("img")).toHaveCSS("transform", /matrix\(2\.5/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
