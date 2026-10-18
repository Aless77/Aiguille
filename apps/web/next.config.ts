import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Docker Desktop (Windows/macOS) ne transmet pas les événements fichiers au conteneur : sans
  // sondage, le rechargement à chaud ne voit pas les modifications. Activé par compose.yaml
  // uniquement (coûteux en CPU, déconseillé ailleurs ; voir docs/developpement.md).
  ...(process.env.NEXT_DEV_POLL_MS
    ? { watchOptions: { pollIntervalMs: Number(process.env.NEXT_DEV_POLL_MS) } }
    : {}),
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
