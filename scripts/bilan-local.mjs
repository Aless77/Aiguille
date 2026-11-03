// Vérification de lecture seule, dans le conteneur web déjà configuré.
// Aucun secret ni contenu de compte n'est écrit dans le résultat.
import postgres from "postgres";
import nextEnv from "@next/env";
import { createAdminToken } from "../apps/web/src/lib/auth/admin-token.ts";

const base = "http://127.0.0.1:3000";
nextEnv.loadEnvConfig(new URL("../apps/web", import.meta.url).pathname, true);
const token = createAdminToken({ ...process.env, NODE_ENV: "development" });
const results = [];
async function inspect(label, path, expected, authenticated = false) {
  try {
    const response = await fetch(new URL(path, base), {
      redirect: "manual",
      headers: authenticated ? { cookie: `aiguille-admin=${token}` } : {},
      signal: AbortSignal.timeout(90000),
    });
    const html = await response.text();
    const item = {
      label,
      status: response.status,
      attendu: expected,
      ok: response.status === expected,
    };
    results.push(item);
    return { html, response };
  } catch {
    results.push({ label, ok: false, erreur: "Lecture impossible ou délai dépassé" });
    return null;
  }
}

await inspect("Visiteur : catalogue protégé", "/montres", 307);
await inspect("Visiteur : avis protégés", "/api/avis?montre=1", 403);
await inspect("Visiteur : listes protégées", "/api/listes", 403);
await inspect("Ancienne adresse administration absente", "/administration", 404);
const sitemap = await inspect("Sitemap privé", "/sitemap.xml", 200);
if (sitemap) results.push({ label: "Sitemap sans URL", ok: !sitemap.html.includes("<loc>") });
const robots = await inspect("Robots", "/robots.txt", 200);
if (robots)
  results.push({
    label: "Exploration interdite",
    ok: /Disallow:\s*\/\s*(?:\n|$)/.test(robots.html),
  });

if (token) {
  for (const path of [
    "/",
    "/montres",
    "/marques",
    "/nouveautes",
    "/boutiques",
    "/prix-en-europe",
    "/communaute",
    "/en/montres",
  ]) {
    await inspect(`Administrateur : ${path}`, path, 200, true);
  }
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    const samples =
      await sql`SELECT DISTINCT ON (b.id) b.slug AS brand, c.slug AS collection, w.slug AS watch FROM watches w JOIN brands b ON b.id=w.brand_id JOIN collections c ON c.id=w.collection_id ORDER BY b.id, w.id`;
    for (const sample of samples) {
      const page = await inspect(
        `Fiche échantillon : ${sample.brand}`,
        `/montres/${sample.brand}/${sample.collection}/${sample.watch}`,
        200,
        true,
      );
      if (page)
        results.push({
          label: `HTML essentiel : ${sample.brand}`,
          ficheTechnique: page.html.includes("Fiche technique"),
          produitStructure: /"@type"\s*:\s*"Product"/.test(page.html),
          nonIndexable: /noindex/.test(page.html),
          ok:
            page.html.includes("Fiche technique") &&
            /"@type"\s*:\s*"Product"/.test(page.html) &&
            /noindex/.test(page.html),
        });
    }
  } finally {
    await sql.end();
  }
} else {
  results.push({
    label: "Parcours administrateur",
    ok: false,
    erreur: "Session de contrôle indisponible avec la configuration actuelle",
  });
}
console.log(JSON.stringify(results, null, 2));
if (results.some((item) => item.ok === false)) process.exitCode = 1;
