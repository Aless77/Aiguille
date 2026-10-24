# Déploiement

## Chaîne de déploiement

| Événement                | GitHub Actions                                                       | Vercel                                |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------- |
| PR ouverte / mise à jour | CI : lint, format, types, tests, build, migrations                   | Preview (URL unique, **non indexée**) |
| Push / fusion sur `dev`  | CI de la PR                                                          | Aucun déploiement                     |
| Fusion sur `main`        | CI sur `main`                                                        | **Production** automatique            |
| Chaque nuit à 03:00 UTC  | Workflow « Collecte quotidienne » → Neon, puis invalidation du cache | Pages régénérées à la visite suivante |

Le déploiement passe par l'**intégration Git de Vercel** (pas de workflow de déploiement à
maintenir). Vercel ne rebuild que si `apps/web`, `packages/` ou les fichiers npm racine changent
(`ignoreCommand` dans [apps/web/vercel.json](../apps/web/vercel.json)) : une PR de doc seule ne
consomme pas de build. La branche `dev` n'est jamais déployée (`git.deploymentEnabled` dans le même
fichier) : seule `main` alimente le site, et une preview de `dev` n'apporterait rien.

Dépendances : pas de PR de mise à jour automatique (Dependabot version updates retiré). Les
**alertes de sécurité** Dependabot restent actives (Settings → Code security → Dependabot alerts).
Les montées de version se font à la main, régulièrement :
`docker compose run --rm tools npm outdated`, lecture du changelog, PR vers `dev`.

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

En production, `apps/web/vercel.json` applique `npm run db:migrate` **avant** `next build`.
Si une migration échoue, le build s'arrête et le déploiement précédent reste en place.
Les migrations déjà appliquées ne sont pas rejouées. Le seed et les collectes restent séparés.
En preview, aucune migration automatique n'est exécutée : préparer une base dédiée et migrée,
sans accorder d'écriture sur la base de production aux builds de branches.

1. Vercel → projet `aiguille` → Storage (Marketplace) → **Neon** → Create, région Europe
   (Francfort). L'intégration crée `DATABASE_URL` dans Production et Preview, et peut créer une
   branche Neon par preview.
2. Appliquer les migrations et le seed sur la base Neon depuis le poste :
   `docker compose run --rm -e DATABASE_URL="<url Neon>" tools sh -c "npm run db:migrate && npm run db:seed"`
3. Lancer une première collecte vers Neon (même commande avec `npm run scraper`), puis redéployer.
   Ensuite, la collecte quotidienne tourne seule (voir « 7. Collecte quotidienne »).

### 4. Variables d'environnement

| Variable               | Où                                                 | Valeur                                            |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`         | Vercel (Prod + Preview), GitHub Secrets (scraper)  | URL Postgres poolée                               |
| `NEXT_PUBLIC_SITE_URL` | Vercel **Production** seulement                    | `https://<domaine>` (sans barre finale)           |
| `SCRAPER_USER_AGENT`   | GitHub Actions (variable)                          | `AiguilleBot/0.1 (+https://<domaine>/a-propos)`   |
| `REVALIDATE_SECRET`    | Vercel (Production) **et** GitHub Actions (secret) | Chaîne aléatoire longue, identique des deux côtés |
| `BETTER_AUTH_SECRET`   | Vercel (Production)                                | Chaîne aléatoire longue (signature des sessions)  |
| `GOOGLE_CLIENT_*`      | Vercel (Production)                                | Identifiant et secret OAuth Google (section 8)    |
| `GITHUB_CLIENT_*`      | Vercel (Production)                                | Identifiant et secret OAuth GitHub (section 8)    |
| `SITE_URL`             | GitHub Actions (variable)                          | `https://<domaine>`                               |

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

### 7. Collecte quotidienne (GitHub Actions)

Workflow [.github/workflows/scrape.yml](../.github/workflows/scrape.yml) : chaque nuit à 03:00 UTC,
une tâche par marque en parallèle, qui enchaîne France, 2 pays du jour et un lot de boutiques
(Longines, la plus longue : ~3 h 15), puis une tâche par revendeur (~1 h 45), après application
des migrations et récupération des taux BCE. Sans le
secret `DATABASE_URL`, le workflow s'arrête proprement avec un avertissement.

1. GitHub → Settings → Secrets and variables → Actions :
   - **Secrets** : `DATABASE_URL` (Neon), `REVALIDATE_SECRET` ;
   - **Variables** : `SITE_URL`, `SCRAPER_USER_AGENT`.
2. Vercel → Environment Variables (Production) : `REVALIDATE_SECRET`, même valeur.
3. Premier essai : Actions → « Collecte quotidienne » → Run workflow, avec `limit` = 5.

Générer un secret : `docker compose run --rm tools node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Une source cassée fait échouer sa tâche (zéro montre extraite) : GitHub envoie alors un e-mail. Le
journal `scrape_runs` garde le détail de chaque exécution.

### 8. Comptes : connexion Google et GitHub (lot 5)

Créer une application OAuth par fournisseur et par environnement (production et local), puis
renseigner les variables dans Vercel (Production) ou dans `.env` en local. Un fournisseur sans
ses deux variables n'apparaît pas sur `/connexion`.

1. **Secret de session** : `BETTER_AUTH_SECRET`, généré avec la même commande que
   `REVALIDATE_SECRET` mais avec une **autre** valeur. Vercel → Environment Variables → Production.
2. **GitHub** : github.com → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL : `https://aiguille.aless-villa.com`
   - Authorization callback URL : `https://aiguille.aless-villa.com/api/auth/callback/github`
   - Puis Generate a new client secret → `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET`.
   - Une seule URL de rappel par application GitHub : créer une seconde application pour le
     local (`http://localhost:3000/api/auth/callback/github`).
3. **Google** : console.cloud.google.com → nouveau projet « Aiguille » → APIs & Services.
   - OAuth consent screen (Google Auth Platform) : type External, nom « Aiguille », e-mail de
     contact, domaine autorisé `aless-villa.com`, puis **Publish app** (sinon seuls les
     utilisateurs de test peuvent se connecter).
   - Credentials → Create credentials → OAuth client ID → Web application.
   - Authorized JavaScript origins : `https://aiguille.aless-villa.com` (et
     `http://localhost:3000` pour le local).
   - Authorized redirect URIs : `https://aiguille.aless-villa.com/api/auth/callback/google` (et
     `http://localhost:3000/api/auth/callback/google`).
   - → `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`.
4. Redéployer la production (les variables ne sont lues qu'au déploiement), puis tester
   `/connexion`.

En local, ouvrir le site par `http://localhost:3000` (pas `127.0.0.1`) : les fournisseurs
n'acceptent que les URL de rappel déclarées.

### 9. Avis : anti-spam Cloudflare Turnstile (lot 5)

Facultatif mais recommandé avant d'ouvrir les avis au public. Sans ces deux variables, le
formulaire fonctionne sans vérification anti-robot (la connexion reste obligatoire).

1. dash.cloudflare.com → **Turnstile** → **Add widget**.
   - Nom : `Aiguille` ; Hostname : `aiguille.aless-villa.com` (et `localhost` pour tester en local).
   - Mode : **Managed** (invisible pour la plupart des visiteurs).
2. Copier les deux clés dans Vercel (Production) :
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (type Config : elle est publique, affichée dans la page) ;
   - `TURNSTILE_SECRET_KEY` (type Secret).
3. Redéployer : les fiches sont prérendues au build, la clé du site y est inscrite à ce moment.

Après le premier déploiement du lot 5, lancer une fois la « Collecte quotidienne » (`limit` = 1) :
sa tâche « Migrations » crée les tables `reviews` et `watch_scores`, et le scraper calcule les
notes. Manuellement : `docker compose run --rm -e DATABASE_URL="<url Neon>" tools npm run db:scores`.

## Critères d'acceptation du lot 1

- [ ] `docker compose up` lance le site et la base sans rien installer d'autre
- [ ] Un push sur `main` déploie automatiquement sur Vercel
- [ ] Le domaine Cloudflare pointe vers le site, certificat SSL valide

## Retour arrière

Vercel → Deployments → choisir un déploiement précédent → « Promote to Production » (instantané).
Pour la base, les migrations Drizzle ne sont pas réversibles automatiquement : écrire une nouvelle
migration corrective.
