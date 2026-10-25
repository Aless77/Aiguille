# Développement

## Principe : tout tourne dans Docker

Rien n'est installé sur le poste hors Docker et Git. Les dépendances npm vivent dans des volumes
Docker (`node_modules`, `.next`) : binaires Linux, disque rapide, aucun `node_modules` sur l'hôte.

Le serveur de développement utilise le volume `web_next` (`.next`). Les outils et le serveur des
tests de production utilisent un autre volume, `web_check_next` (`.next-e2e`). Ainsi, un build ou
une génération de types ne réécrit pas le cache du serveur ouvert sur le port 3000. Les sorties de
build restent sur disque Linux : les milliers de fichiers générés ne transitent pas par le partage
Windows. Ne pas lancer deux builds simultanément dans `.next-e2e`.

| Service   | Rôle                                                      | Port |
| --------- | --------------------------------------------------------- | ---- |
| `setup`   | `npm ci`, migrations, seed ; se termine puis libère `web` | —    |
| `web`     | `next dev` avec rechargement à chaud                      | 3000 |
| `db`      | PostgreSQL 17                                             | 5432 |
| `adminer` | Interface web de la base                                  | 8080 |
| `scraper` | À la demande (`docker compose run --rm scraper`)          | —    |
| `tools`   | Shell outil (`docker compose run --rm tools <commande>`)  | —    |

## Commandes

```bash
docker compose up                              # tout lancer
docker compose up -d && docker compose logs -f web
docker compose run --rm tools npm run check    # avant chaque push
docker compose run --rm tools npm run build
docker compose run --rm tools sh               # shell interactif dans le conteneur
docker compose down                            # arrêter
docker compose down -v                         # arrêter ET effacer base + dépendances
```

Après avoir ajouté une dépendance (`docker compose run --rm tools npm install -w @aiguille/web zod`),
committez `package.json` et `package-lock.json`. Les autres développeurs relancent `docker compose up`
(le service `setup` refait `npm ci`).

## Scraper

```bash
docker compose run --rm scraper                      # toutes les sources (long : 4 s par fiche)
docker compose run --rm scraper hamilton --limit 5   # essai sur 5 fiches
docker compose run --rm scraper lepage ocarat        # revendeurs (après les sites officiels)
docker compose run --rm scraper taux                 # taux de change BCE du jour
docker compose run --rm scraper tissot --pays CH,GB  # prix nationaux (--pays auto : pays du jour)
docker compose run --rm scraper longines --boutiques # boutiques agréées, lot de 400
```

En essai (`--limit`), les montres non revues ne sont jamais marquées « plus produites ».

## Base de données

1. Modifier `packages/db/src/schema.ts`.
2. `docker compose run --rm tools npm run db:generate` : crée une migration SQL dans `packages/db/drizzle/`.
3. Relire le SQL généré, puis `docker compose run --rm tools npm run db:migrate`.
4. Committer schéma et migration ensemble. La CI échoue si le schéma n'a pas sa migration.

Drizzle Studio : `docker compose run --rm -p 4983:4983 tools npm run db:studio`.

## Qualité

| Outil      | Rôle                                         | Commande               |
| ---------- | -------------------------------------------- | ---------------------- |
| ESLint 9   | Règles Next (Core Web Vitals), TypeScript    | `npm run lint`         |
| Prettier   | Formatage, tri des classes Tailwind          | `npm run format:check` |
| TypeScript | Types stricts sur chaque workspace           | `npm run typecheck`    |
| Vitest     | Tests unitaires (`*.test.ts` à côté du code) | `npm test`             |

`npm run check` enchaîne les quatre.

### Tests de bout en bout (Playwright)

`apps/web/e2e/` : parcours principaux et exigences SEO (titre, description, canonique, JSON-LD,
vrais 404, robots.txt, sitemap), sur ordinateur et mobile. Ils visent un **build de production**
(le serveur de dev compile à la demande : trop lent et instable sous des tests parallèles).

```bash
docker compose up -d                          # prérequis : dépendances installées, base migrée
docker compose --profile e2e run --rm e2e     # build web-prod (quelques minutes) puis tests
docker compose --profile e2e stop web-prod    # libère le serveur de production
```

En CI, le job « Build Next.js » rejoue ce scénario sur une base contenant seulement trois montres
fictives (`npm run seed:e2e`, refusé hors base locale).

## Workflow Git

- `dev` : branche d'intégration. Les développements (éventuellement en parallèle) y sont fusionnés
  et testés ; chaque push produit une preview Vercel (non indexée).
- `main` : production, protégée (PR obligatoire, CI verte). Une PR `dev` → `main` valide une version ;
  sa fusion déploie automatiquement sur Vercel.
- Commits en français, préfixés (`feat:`, `fix:`, `docs:`…). Les agents de code travaillent sur la
  branche courante et ne créent ni branche, ni commit, ni PR.

## Rechargement à chaud

Docker Desktop ne transmet pas les événements fichiers de Windows/macOS au conteneur. Le service
`web` sonde donc les fichiers toutes les secondes (`NEXT_DEV_POLL_MS` dans `compose.yaml`, lu par
`next.config.ts`) : une modification apparaît en une à deux secondes, au prix d'un peu de CPU.

Plus rapide et plus léger : cloner le dépôt **dans WSL 2** (pas sur `C:`) et lancer
`docker compose up` depuis WSL. Les fichiers ne traversent plus la couche de partage et le
sondage devient inutile (`NEXT_DEV_POLL_MS` vide).

Après l'installation d'une dépendance, si la page se recharge en boucle (cache Turbopack pointant
vers d'anciens chemins de `node_modules`) : `docker compose stop web`, puis
`docker compose run --rm tools rm -rf apps/web/.next/dev apps/web/.next/cache`, puis
`docker compose up -d --no-deps web`. Même procédure si toutes les pages restent en chargement avec
des erreurs `watch error` sur des chemins de dépendances. `--no-deps` évite de relancer `setup`
et son `npm ci` ; les dépendances doivent déjà être installées et la base démarrée.

Le sondage ne détecte pas les **nouveaux dossiers de routes** (`src/app/…/page.tsx`) :
redémarrer `docker compose restart web` après en avoir créé un.

## Éditeur

### Messages de console du navigateur

- `Download the React DevTools…` et `[HMR] connected` sont des messages informatifs en développement.
- Une erreur d'hydratation montrant `data-darkreader-inline-stroke` et
  `--darkreader-inline-stroke` sur les SVG vient de **Dark Reader**, qui modifie le HTML avant React.
  Le site suit déjà le thème du système : le layout émet directement dans son `<head>` une balise
  `<meta name="darkreader-lock" content="true">` pour demander à l'extension de ne pas le réécrire.
  Ne pas déplacer ce verrou dans `metadata.other` : avec `generateMetadata`, Next.js peut diffuser
  cette balise après les premières icônes. Dark Reader les a alors déjà modifiées avant React.
  Régression couverte dans `e2e/catalogue.spec.ts` : le verrou doit précéder la fermeture du
  `<head>` et le premier SVG dans la réponse HTML destinée à un navigateur ordinaire.
  Recharger complètement la page après la correction ; si le problème persiste, désactiver Dark
  Reader pour `localhost` et `127.0.0.1`, puis recharger. Ne pas masquer les avertissements sur tous
  les composants : cela cacherait aussi les vrais défauts d'hydratation.
- `Can't add file system: <illegal path>` : le serveur Next.js de développement publie
  `/.well-known/appspecific/com.chrome.devtools.json` avec le dossier `/app/apps/web`. Ce chemin
  existe dans Docker, mais pas sur Windows où Chrome cherche à ouvrir l'espace de travail.
  Dans les outils de développement Chrome, retirer un éventuel dossier associé dans
  **Settings → Workspace**, puis désactiver **DevTools Project Settings** dans
  `chrome://flags/#devtools-project-settings` et relancer Chrome. Si le navigateur propose aussi
  **DevTools Automatic Workspace Folders**, le désactiver également. L'éditeur peut continuer à
  modifier les fichiers du dépôt normalement ; aucune installation sur l'hôte n'est nécessaire.

Références : [verrou Dark Reader](https://github.com/darkreader/darkreader/blob/main/CONTRIBUTING.md#disabling-dark-reader-on-your-site),
[espaces de travail automatiques Chrome](https://developer.chrome.com/docs/devtools/automatic-workspaces).

Sans `node_modules` sur l'hôte, l'autocomplétion TypeScript de l'éditeur est limitée. Pour un
confort complet, ouvrez le dossier dans un Dev Container (VS Code : « Reopen in Container » en
utilisant le service `tools`), ce qui reste conforme à la règle « tout en conteneur ».
