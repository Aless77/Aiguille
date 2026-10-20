import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Pas de Partial Prefetching : il sert une « coquille » en 200 aux URL absentes du build, puis
  // appelle notFound() trop tard (soft 404 pour les moteurs). Sans lui, une URL inconnue est
  // rendue de façon bloquante et renvoie un vrai 404. Toutes nos pages étant prérendues, leurs
  // liens restent préchargés normalement. Vérifié par e2e/catalogue.spec.ts.
  partialPrefetching: false,
  // Docker Desktop (Windows/macOS) ne transmet pas les événements fichiers au conteneur : sans
  // sondage, le rechargement à chaud ne voit pas les modifications. Activé par compose.yaml
  // uniquement (coûteux en CPU, déconseillé ailleurs ; voir docs/developpement.md).
  ...(process.env.NEXT_DEV_POLL_MS
    ? { watchOptions: { pollIntervalMs: Number(process.env.NEXT_DEV_POLL_MS) } }
    : {}),
  // Build de production des tests e2e locaux dans un dossier séparé, pour ne pas écraser celui du
  // serveur de dev (service compose « web-prod »).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Next n'autorise par défaut que « localhost » pour ses ressources de dev. Sans ces entrées, la
  // page ne s'hydrate pas (composants clients muets, cartes vides) quand on l'ouvre :
  // - par 127.0.0.1 depuis le navigateur du poste ;
  // - par le nom d'hôte Docker « web » depuis un autre conteneur (tests e2e).
  allowedDevOrigins: ["127.0.0.1", "web"],
  // Paquet interne du monorepo publié en sources TypeScript.
  transpilePackages: ["@aiguille/db"],
  images: {
    // Images servies telles quelles depuis les sites des marques : l'optimisation Vercel est
    // limitée sur l'offre Hobby et ~1 000 références l'épuiseraient (docs/decisions.md).
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
