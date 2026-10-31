import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { closeDb, getDb, sessions, users } from "@aiguille/db";
import { eq } from "drizzle-orm";
import { makeSignature } from "better-auth/crypto";

import { createAdminToken } from "../src/lib/auth/admin-token";

test.use({ storageState: { cookies: [], origins: [] } });

test("un visiteur ne peut accéder ni au catalogue ni aux données", async ({
  page,
  request,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/montres");
  await expect(page).toHaveURL(/\/demande-acces$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Demander l’accès à Aiguille");
  await expect(
    page.getByRole("link", { name: "Se connecter pour demander un accès" }),
  ).toBeVisible();
  expect((await request.get("/api/avis?montre=1")).status()).toBe(403);
  expect((await request.get("/api/listes")).status()).toBe(403);
  const response = await request.get("/listes/inconnue", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByRole("link", { name: "Administration des accès" })).toHaveCount(0);
  const hidden = await request.get("/administration", { maxRedirects: 0 });
  expect(hidden.status()).toBe(404);
  expect(hidden.headers()["location"]).toBeUndefined();
  expect(await page.content()).not.toContain(
    process.env.ADMIN_ACCESS_PATH ?? "adresse-inexistante",
  );
  await page.screenshot({ path: testInfo.outputPath("demande-acces.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("l'administrateur se connecte puis se déconnecte", async ({ page }) => {
  test.skip(
    !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_ACCESS_PATH,
    "Identifiants de test requis",
  );
  await page.goto(process.env.ADMIN_ACCESS_PATH!);
  await page.getByLabel("Identifiant", { exact: true }).fill(process.env.ADMIN_USERNAME!);
  await page.getByLabel("Mot de passe", { exact: true }).fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Se déconnecter de l’administration" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Entrer sur le site" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(process.env.ADMIN_ACCESS_PATH!);
  await page.getByRole("button", { name: "Se déconnecter de l’administration" }).click();
  await expect(page.getByLabel("Mot de passe", { exact: true })).toBeVisible();
  await page.goto("/montres");
  await expect(page).toHaveURL(/\/demande-acces$/);
});

test("demande, acceptation puis retrait d'accès d'un membre", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  test.skip(
    !process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET || !createAdminToken(),
    "Base et identifiants de test requis",
  );
  const id = randomUUID();
  const email = `${id}@example.invalid`;
  const token = randomUUID();
  const signature = await makeSignature(token, process.env.BETTER_AUTH_SECRET!);
  const admin = await browser.newContext({
    storageState: {
      cookies: [
        {
          name: "aiguille-admin",
          value: createAdminToken()!,
          domain: new URL(baseURL!).hostname,
          path: "/",
          httpOnly: true,
          secure: false,
          sameSite: "Strict",
          expires: -1,
        },
      ],
      origins: [],
    },
  });
  try {
    await getDb()
      .insert(users)
      .values({ id, name: "Membre de test", email, emailVerified: true, country: "ZZ" });
    await getDb()
      .insert(sessions)
      .values({ id: randomUUID(), token, userId: id, expiresAt: new Date(Date.now() + 3600_000) });
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: encodeURIComponent(`${token}.${signature}`),
        domain: new URL(baseURL!).hostname,
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/demande-acces");
    await page
      .getByLabel("Pourquoi souhaitez-vous accéder à Aiguille ?")
      .fill("Je souhaite comparer plusieurs montres avant de choisir ma première automatique.");
    await page
      .getByLabel("D’où venez-vous et comment avez-vous découvert Aiguille ?")
      .fill("France, par un ami");
    await page.getByLabel("Quelles marques vous intéressent ?").fill("Tissot et Hamilton");
    await page.screenshot({ path: testInfo.outputPath("demande-formulaire.png"), fullPage: true });
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(page.getByRole("status")).toContainText("en attente");
    expect((await page.request.get("/api/avis?montre=1")).status()).toBe(403);

    const adminPage = await admin.newPage();
    await adminPage.goto(`${baseURL}${process.env.ADMIN_ACCESS_PATH}`);
    const card = adminPage.getByRole("article").filter({ hasText: email });
    await expect(card).toContainText("France, par un ami");
    await card.getByRole("button", { name: "Accepter l’accès" }).click();
    await expect(card).toContainText("Accepté");
    await adminPage.screenshot({ path: testInfo.outputPath("administration.png"), fullPage: true });
    await page.reload();
    await expect(page.getByRole("status")).toContainText("accepté");
    await page.getByRole("link", { name: "Entrer sur le site" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect((await page.request.get("/montres", { maxRedirects: 0 })).status()).toBe(200);

    await card.getByRole("button", { name: "Refuser / retirer l’accès" }).click();
    await expect(card).toContainText("Refusé");
    expect((await page.request.get("/montres", { maxRedirects: 0 })).status()).toBe(307);
    expect((await page.request.get("/api/avis?montre=1")).status()).toBe(403);
    await page.goto("/demande-acces");
    await expect(page.getByRole("status")).toContainText("n’a pas été acceptée");
  } finally {
    await admin.close();
    await getDb().delete(users).where(eq(users.id, id));
    await closeDb();
  }
});
