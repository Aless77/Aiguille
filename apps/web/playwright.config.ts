import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout : parcours principaux et exigences SEO de docs/seo/checklist.md.
 * Ils visent un serveur déjà lancé (BASE_URL) :
 *   - en local : docker compose run --rm e2e (contre le build de production « web-prod ») ;
 *   - en CI : build de production démarré par le job (voir .github/workflows/ci.yml).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    locale: "fr-FR",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
