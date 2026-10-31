import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

const webFiles = ["apps/web/**/*.{js,jsx,mjs,ts,tsx}"];

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/.next-e2e/**",
    "**/test-results/**",
    "**/playwright-report/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    "packages/db/drizzle/**",
  ]),

  // Site Next.js : règles officielles Next (Core Web Vitals, accessibilité, hooks).
  // Restreintes à apps/web : sans cela, certaines s'appliqueraient aussi au scraper et aux configs.
  ...[...nextVitals, ...nextTs].map((config) => ({ ...config, files: webFiles })),
  {
    files: webFiles,
    settings: { next: { rootDir: "apps/web/" } },
    rules: {
      // Règle propre au Pages Router : le projet n'utilise que l'App Router.
      "@next/next/no-html-link-for-pages": "off",
    },
  },

  // Scraper, base et fichiers de config : TypeScript strict.
  {
    files: [
      "scripts/**/*.mjs",
      "apps/scraper/**/*.ts",
      "apps/atelier/**/*.ts",
      "packages/**/*.ts",
      "*.{js,mjs,ts,mts}",
    ],
    extends: [tseslint.configs.recommended],
  },

  // Règles communes au projet.
  {
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },

  // Toujours en dernier : désactive les règles de style gérées par Prettier.
  prettier,
]);
