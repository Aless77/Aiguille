# Déploiement

## Chaîne de déploiement

| Événement                | GitHub Actions                                     | Vercel                                |
| ------------------------ | -------------------------------------------------- | ------------------------------------- |
| PR ouverte / mise à jour | CI : lint, format, types, tests, build, migrations | Preview (URL unique, **non indexée**) |
| Fusion sur `main`        | CI sur `main`                                      | **Production** automatique            |
| Cron quotidien (lot 3)   | Scraper → base de production                       | —                                     |

Le déploiement passe par l'**intégration Git de Vercel** (pas de workflow de déploiement à
maintenir). Vercel ne rebuild que si `apps/web`, `packages/` ou les fichiers npm racine changent
(`ignoreCommand` dans [apps/web/vercel.json](../apps/web/vercel.json)) : une PR de doc seule ne
consomme pas de build.

## Mise en place initiale (une seule fois)

### 1. Protéger `main` sur GitHub

Settings → Branches → règle sur `main` :

- Exiger une PR avant fusion.
- Exiger les checks : `Lint, format, types, tests`, `Build Next.js`, `Migrations et seed`.
- Interdire les force-push.

### 2. Créer le projet Vercel (offre Hobby)

1. vercel.com → Add New → Project → importer `Aless77/Aiguille`.
2. **Root Directory : `apps/web`** (laisser cochée l'option « Include files outside the root
   directory », nécessaire pour les workspaces npm).
3. Framework : Next.js (détecté). Commandes par défaut : Vercel lance `npm install` à la racine du
   monorepo et `next build` dans `apps/web`.
4. Node.js : 24.x (Settings → General).

### 3. Base de production

**Neon** (voir [decisions.md](decisions.md)). Le build Vercel **lit la base** (pages prérendues) :
sans `DATABASE_URL`, le déploiement échoue.

1. Vercel → projet `aiguille` → Storage (Marketplace) → **Neon** → Create, région Europe
   (Francfort). L'intégration crée `DATABASE_URL` dans Production et Preview, et peut créer une
   branche Neon par preview.
2. Appliquer les migrations et le seed sur la base Neon depuis le poste :
   `docker compose run --rm -e DATABASE_URL="<url Neon>" tools sh -c "npm run db:migrate && npm run db:seed"`
3. Lancer une première collecte vers Neon (même commande avec `npm run scraper`), puis redéployer.
   La collecte quotidienne par GitHub Actions arrive au lot 3.

### 4. Variables d'environnement

| Variable               | Où                                                | Valeur                                          |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL`         | Vercel (Prod + Preview), GitHub Secrets (scraper) | URL Postgres poolée                             |
| `NEXT_PUBLIC_SITE_URL` | Vercel **Production** seulement                   | `https://<domaine>` (sans barre finale)         |
| `SCRAPER_USER_AGENT`   | GitHub Actions                                    | `AiguilleBot/0.1 (+https://<domaine>/a-propos)` |

`NEXT_PUBLIC_SITE_URL` absent en preview : l'URL de la preview est alors déduite de `VERCEL_URL`,
et `isIndexable()` renvoie `false` car `VERCEL_ENV` vaut `preview` (robots `Disallow: /` et
`noindex`).

Idéalement, les previews utilisent une **branche** de base séparée (Neon branching ou base Supabase
de staging) pour ne jamais écrire en production depuis une PR.

### 5. Domaine Cloudflare

1. Vercel → Settings → Domains → ajouter `<domaine>` et `www.<domaine>`, choisir l'apex comme
   domaine principal (redirection 308 de `www` vers l'apex).
2. Cloudflare → DNS, en **« DNS only » (nuage gris)**, sinon Vercel ne peut pas émettre le certificat :
   - `A @ 76.76.21.21` (ou la valeur affichée par Vercel)
   - `CNAME www cname.vercel-dns.com`
3. Attendre « Valid Configuration » côté Vercel : le certificat SSL est émis automatiquement.
4. Mettre `NEXT_PUBLIC_SITE_URL=https://<domaine>` et redéployer.

### 6. Après la mise en ligne

Déclarer le site dans Google Search Console et Bing Webmaster Tools et soumettre
`https://<domaine>/sitemap.xml` (voir [seo/strategie.md](seo/strategie.md#mesure-et-outils)).

## Critères d'acceptation du lot 1

- [ ] `docker compose up` lance le site et la base sans rien installer d'autre
- [ ] Un push sur `main` déploie automatiquement sur Vercel
- [ ] Le domaine Cloudflare pointe vers le site, certificat SSL valide

## Retour arrière

Vercel → Deployments → choisir un déploiement précédent → « Promote to Production » (instantané).
Pour la base, les migrations Drizzle ne sont pas réversibles automatiquement : écrire une nouvelle
migration corrective.
