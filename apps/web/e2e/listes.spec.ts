import { expect, test } from "@playwright/test";

/** Listes de souhaits et communauté : parcours sans compte (le seed publie une liste de test). */
test.describe("listes de souhaits et communauté", () => {
  test("la communauté présente les listes publiées", async ({ page }) => {
    await page.goto("/communaute");
    await expect(page.getByRole("heading", { level: 1, name: "Communauté" })).toBeVisible();
    await page.getByRole("link", { name: /Ma sélection de test/ }).click();
    await expect(page).toHaveURL(/\/listes\/e2etestz2345$/);
  });

  test("une liste partagée se lit sans compte, avec ses avis", async ({ page }) => {
    await page.goto("/listes/e2etestz2345");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ma sélection de test" }),
    ).toBeVisible();
    await expect(page.getByText("Liste de Testeur 1")).toBeVisible();
    await expect(page.getByText(/1 montre · .*au total/)).toBeVisible();
    await expect(page.getByText("Bon choix, la finition est soignée pour le prix.")).toBeVisible();
    // Sans compte : invitation à se connecter, pas de réglages d'auteur.
    await expect(page.getByRole("link", { name: "Connectez-vous" })).toBeVisible();
    await expect(page.getByText("Votre liste")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("un lien de liste inconnu renvoie un vrai 404", async ({ page }) => {
    const response = await page.goto("/listes/zzzzzzzzzzzz");
    expect(response?.status()).toBe(404);
  });

  test("créer une liste ou donner un avis exige une connexion", async ({ request }) => {
    const create = await request.post("/api/listes", { data: { title: "Test" } });
    expect(create.status()).toBe(401);
    const comment = await request.post("/api/listes/e2etestz2345/commentaires", {
      data: { body: "Avis anonyme" },
    });
    expect(comment.status()).toBe(401);
  });

  test("la fiche invite à se connecter pour ajouter la montre à une liste", async ({ page }) => {
    await page.goto("/listes/e2etestz2345");
    await page
      .getByRole("link", { name: /Testeur|TEST-0001|Montre de test/ })
      .first()
      .click();
    await expect(
      page.getByRole("link", { name: /Se connecter pour l'ajouter à une liste/ }),
    ).toBeVisible();
  });
});

test.describe("discussion d'une liste", () => {
  test("réponses en fil, auteur signalé, membre anonyme caché", async ({ page }) => {
    await page.goto("/listes/e2etestz2345");
    const replies = page.getByRole("list", { name: "Réponses à Testeur 2" });
    await expect(replies.getByText("Merci pour le conseil !")).toBeVisible();
    await expect(replies.getByText("Auteur de la liste")).toBeVisible();
    await expect(replies.getByText("Réponse anonyme : d'accord sur la finition.")).toBeVisible();
    await expect(replies.getByText("(anonyme)")).toBeVisible();
    await expect(page.getByText("Je préfère le cadran bleu, mais question de goût.")).toBeVisible();
    await expect(page.getByText("(anonyme)")).toHaveCount(2);
    // Le nom du membre anonyme n'apparaît nulle part dans la page.
    expect(await page.content()).not.toContain("Testeur 3");
    await expect(page.getByRole("button", { name: "Répondre" }).first()).toBeVisible();
  });
});
