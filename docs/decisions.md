# Journal des décisions

Format : date, décision, raison. Les plus récentes en haut. Une décision ne se remet en cause que
par une nouvelle entrée qui la remplace explicitement.

## 2026-10-20 – Thème clair par défaut

Le site s'affiche en clair, quelle que soit la préférence du système ; un bouton de l'en-tête
passe en sombre. Le choix est gardé un an dans le cookie `theme` (fonctionnel, exempté de
consentement), lu par un script inline en tête de `<body>` qui pose la classe `dark` avant
l'affichage : pas de flash, et le serveur ne lit jamais le cookie, donc les pages restent
prérendues et en cache. Cartes et graphiques suivent ce thème (`useIsDarkTheme`). Le script n'est
ni dans `next/script` (exécuté trop tard, flash blanc) ni dans `<head>` (recréé côté client par
React 19, avertissement en console).

## 2026-10-20 – Comptes (lot 5)

| Sujet             | Décision                                                                          | Raison                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Authentification  | Better Auth 1.7 avec l'adaptateur Drizzle, tables `users`, `sessions`, `accounts` | Choix du cahier des charges ; données dans notre base Postgres, sans service tiers payant.                       |
| Connexion         | Google et GitHub uniquement (OAuth), ni mot de passe ni lien magique              | Choix du propriétaire : aucun mot de passe à protéger, aucun service d'e-mail à configurer.                      |
| Session dans l'UI | Lue côté navigateur (`useSession`) dans l'en-tête                                 | Les pages restent statiques et mises en cache ; la session n'entre jamais dans le HTML serveur ni dans le cache. |
| Fournisseurs      | Masqués tant que leurs variables manquent                                         | Le site, la CI et le build fonctionnent sans compte OAuth.                                                       |
| Choix du compte   | `prompt=select_account` chez GitHub et Google                                     | Après une déconnexion, pouvoir changer de compte au lieu d'être reconnecté d'office.                             |
| Données (RGPD)    | Page `/confidentialite` ; suppression du compte en libre-service sur `/compte`    | Exigée par Google pour publier l'application OAuth ; droit à l'effacement sans e-mail de contact public.         |

## 2026-10-19 – Isolation des sorties Next.js dans Docker

Le serveur local conserve `.next` dans `web_next`. Les outils (`next typegen`, `npm run build`) et
les tests de production utilisent `.next-e2e` dans un volume Linux distinct, `web_check_next`.
Cela évite de modifier le cache du serveur de développement pendant les contrôles et de faire
transiter les milliers de fichiers générés par le partage Windows, qui avait rendu les compilations
et le chargement des pages extrêmement lents. Les builds de vérification restent séquentiels.

## 2026-10-19 – Outillage du dépôt

| Sujet        | Décision                                                                                                        | Raison                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dépendances  | Dependabot version updates retiré ; alertes de sécurité gardées ; montées de version à la main (`npm outdated`) | Les PR automatiques visaient `main` et proposaient des majeures inadaptées (`@types/node` 25 pour Node 24). Les failles connues restent signalées. |
| Vercel `dev` | Aucun déploiement de la branche `dev` (`git.deploymentEnabled`)                                                 | Seule `main` alimente le site ; les previews des PR de fonctionnalité suffisent.                                                                   |

## 2026-10-19 – Carte (lot 4)

| Sujet                      | Décision                                                                                                               | Raison                                                                                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pays couverts              | 14 pays européens : FR, DE, IT, ES, NL, BE, AT, PT, IE, CH, GB, SE, DK, PL                                             | Public européen francophone d'abord (décision du propriétaire). Questions ouvertes du cahier des charges tranchées.                                                                                       |
| Prix par pays              | Sites nationaux officiels (JSON-LD), devise locale stockée, conversion à l'affichage au dernier taux BCE (Frankfurter) | Même source que la France, chiffres vérifiables. Un prix dans une autre devise que celle du pays (site « international ») est rejeté.                                                                     |
| Pays absents               | Hamilton : PT et PL ; Longines : IE                                                                                    | Pas de version nationale (redirection vers un autre marché) : pas de prix plutôt qu'un faux prix.                                                                                                         |
| Rotation                   | France chaque jour, 2 autres pays par nuit et par marque : chaque pays revu chaque semaine                             | ~24 000 pages pour 14 pays : impossible chaque nuit au rythme de 4 s. Les prix nationaux bougent peu.                                                                                                     |
| Indice par pays            | Écart **médian** avec la France sur les mêmes références (page /prix-en-europe)                                        | La médiane résiste aux références à prix atypique ; « prix moyen par pays » du cahier des charges.                                                                                                        |
| Boutiques                  | **Écart au cahier des charges** : points de vente agréés publiés par Longines et Hamilton, **sans stock**              | Aucune source gratuite et autorisée ne publie le stock par boutique. Mention « stock non garanti » affichée. Accepté par le propriétaire.                                                                 |
| Boutiques Tissot           | Non collectées                                                                                                         | Localisateur interdit par le robots.txt de Tissot.                                                                                                                                                        |
| Géocodage                  | Inutile : coordonnées publiées dans le JSON-LD des pages boutique                                                      | Nominatim prévu au cahier des charges, remplacé par la source elle-même. Ni e-mail ni téléphone stockés.                                                                                                  |
| Rafraîchissement boutiques | Lots de 400 par nuit et par marque, jamais visitées d'abord ; hors pays couverts revisitées tous les 90 jours          | Liste complète revue en quelques jours sans dépasser le temps d'une tâche.                                                                                                                                |
| Cartes                     | Pays : ECharts + world-atlas (déjà utilisé pour les courbes) ; boutiques : MapLibre **5** + OpenFreeMap                | react-simple-maps non compatible React 19. MapLibre 6 charge son worker en module séparé, mal pris en charge par Turbopack : la v5 (worker intégré) fonctionne d'emblée. OpenFreeMap : gratuit, sans clé. |

## 2026-10-19 – Prix (lot 3)

| Sujet                   | Décision                                                                                                                              | Raison                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Collecte quotidienne    | GitHub Actions, 03:00 UTC, une tâche par marque en parallèle                                                                          | Hors Vercel (cahier des charges) ; la règle de rythme vaut par domaine, donc ~1 h au lieu de ~2 h.                       |
| Fraîcheur du site       | Le scraper appelle `POST /api/revalidate` (secret partagé) → `revalidateTag("catalog", "max")`                                        | Nouveaux prix visibles sans redéploiement ; les nouvelles fiches sont rendues à leur première visite.                    |
| Historique              | Paliers (prix constant jusqu'au changement suivant), prolongés jusqu'au dernier passage                                               | Une ligne n'est stockée qu'au changement : sans prolongation, un prix stable n'aurait qu'un point.                       |
| Courbe                  | ECharts (rendu SVG, chargé à la demande), affichée à partir de 7 jours de relevés ; résumé et tableau en HTML serveur                 | SEO : les chiffres doivent être dans le HTML ; une courbe d'un point n'apprend rien.                                     |
| Stock                   | Dernier relevé du site officiel ; JSON-LD sans `availability` si inconnue                                                             | Ne pas affirmer une disponibilité qu'on ne connaît pas.                                                                  |
| Nouveautés              | Référence apparue plus de 2 jours après la première montre de sa marque                                                               | L'import initial, même découpé en plusieurs exécutions, n'est pas une nouveauté ; aucun changement de schéma.            |
| Exécutions interrompues | Marquées « échouée » au lancement suivant de la même source                                                                           | Un processus tué (arrêt de Docker, runner) ne peut pas se clore lui-même.                                                |
| Revendeurs              | Lepage (3 marques) puis Ocarat (Tissot, Hamilton) ; Histoire d'Or écarté                                                              | Étude du 2026-10-19 (docs/sources.md) : Histoire d'Or ne vend aucune des 3 marques.                                      |
| Rattachement des offres | Par marque + référence normalisée (`reference_key`) ; aucune montre créée par un revendeur                                            | Le catalogue reste défini par les sites officiels ; une fiche revendeur inconnue (ancien modèle) est ignorée et comptée. |
| Offres retirées         | Relevé « sans prix, rupture » pour une offre non revue lors d'une collecte complète (≥ 80 %)                                          | Ne plus afficher une offre disparue, sans tout retirer après une panne.                                                  |
| Affichage               | Tableau « Où la trouver » trié (disponibles puis prix), liens `nofollow` non affiliés, JSON-LD `AggregateOffer` sur toutes les offres | Site non commercial ; données structurées fidèles à la page.                                                             |

## 2026-10-18 – Catalogue et collecte (lot 2)

| Sujet               | Décision                                                                                                                        | Raison                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base de production  | **Neon**                                                                                                                        | Postgres pur, branches de base pour les previews, intégration Vercel. Auth et stockage de Supabase inutiles (Better Auth, R2).                                                               |
| Photos              | **Liens directs vers les images officielles** des marques, avec crédit et lien vers la fiche officielle                         | Meilleur rendu et SEO image. Usage non autorisé formellement : risque accepté pour un site non commercial ; retrait immédiat sur demande d'une marque.                                       |
| Extraction          | JSON-LD `Product` publié par les marques + tableau de caractéristiques HTML                                                     | Le JSON-LD sert à Google : bien plus stable que la mise en page.                                                                                                                             |
| robots.txt          | Vérifié par notre code (`robots-parser`), pas par Crawlee                                                                       | Crawlee télécharge robots.txt avec un User-Agent de navigateur, contraire à nos règles.                                                                                                      |
| En-têtes HTTP       | Générateur d'en-têtes de Crawlee désactivé, User-Agent `AiguilleBot` sur chaque requête                                         | Règle « User-Agent identifiable ». Vérifié sur serveur local.                                                                                                                                |
| Références          | Clé de rapprochement sans séparateurs (`T1374071104100`), affichage reconstitué (`T137.407.11.041.00`)                          | Rapprocher marques, revendeurs et eBay qui écrivent la référence différemment.                                                                                                               |
| Slugs               | Fixés à la création (référence), collection jamais réattribuée                                                                  | URL indexées stables.                                                                                                                                                                        |
| Montres disparues   | Statut « plus produite » seulement après une exécution complète (≥ 80 % des montres revues)                                     | Une panne ou un blocage ne doit pas tout marquer comme arrêté.                                                                                                                               |
| Interface           | shadcn/ui (style base-nova, Base UI) + Lucide ; `cn` local (clsx + tailwind-merge) plutôt que le paquet `cn` proposé par la CLI | Pas de dépendance tierce récente pour deux lignes de code.                                                                                                                                   |
| Thème sombre        | Suit la préférence du système (`prefers-color-scheme`)                                                                          | Pas de sélecteur de thème à maintenir pour l'instant.                                                                                                                                        |
| Images              | `images.unoptimized` : servies telles quelles depuis les marques                                                                | L'optimisation d'images Vercel Hobby serait épuisée par ~1 000 références. Contrepartie : PNG lourds (~2 000 px) ; à revoir (redimensionnement vers R2) si les Core Web Vitals en pâtissent. |
| Pages dynamiques    | Toutes prérendues au build (`generateStaticParams`), `notFound()` avant tout `<Suspense>`, `export const instant = false`       | Vrai statut 404 pour une URL inconnue (avec streaming : 200 + noindex, « soft 404 »).                                                                                                        |
| Textes produits     | Résumé rédigé à partir de nos données, jamais la description marketing des marques                                              | Texte protégé et dupliqué sur des centaines de sites : mauvais pour le droit et le SEO.                                                                                                      |
| Filtres             | Paramètres d'URL nuqs (`marque`, `mouvement`, `prixMin`…), rendu serveur, canonique `/montres`                                  | Partageables, sans pages en double dans l'index.                                                                                                                                             |
| Partial Prefetching | Désactivé (`partialPrefetching: false`)                                                                                         | Il servait une coquille en 200 aux URL absentes du build (`/montres/zzz`) : soft 404. Détecté par les tests e2e sur build de production.                                                     |
| Tests e2e           | Playwright (image Docker officielle) sur build de production ; 3 montres fictives en CI                                         | Le serveur de dev est trop lent et instable pour des tests parallèles ; la CI n'a pas de vraies données.                                                                                     |

## 2026-10-18 – Socle technique (lot 1)

| Sujet            | Décision                                                                             | Raison                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Monorepo         | Workspaces **npm** (`apps/*`, `packages/*`), sans Turborepo                          | Aucun outil en plus ; 3 paquets seulement. Turborepo si les temps de CI l'exigent.                                          |
| Paquets internes | Exportent leurs sources `.ts` (pas de build)                                         | Simplicité ; Next et `tsx` compilent à la volée.                                                                            |
| Next.js          | 16.4 avec `cacheComponents` et `partialPrefetching`                                  | Rendu serveur mis en cache = besoin ISR du cahier des charges.                                                              |
| Linter           | ESLint 9 + `eslint-config-next` + Prettier (pas Biome)                               | Règles officielles Next (Core Web Vitals, a11y). ESLint 10 bloqué : plugins de `eslint-config-next` pas encore compatibles. |
| Tests            | Vitest à la racine, `*.test.ts` à côté du code                                       | Rapide, natif TypeScript. Playwright pour l'e2e, sur build de production.                                                   |
| ORM              | Drizzle + driver `postgres`                                                          | Cahier des charges ; migrations SQL lisibles et versionnées.                                                                |
| Dev local        | Docker Compose ; dépendances dans des volumes Docker                                 | Contrainte « rien sur le PC hors Docker et Git ».                                                                           |
| Déploiement      | Intégration Git Vercel, Root Directory `apps/web`                                    | Previews par PR et prod sur `main` sans workflow à maintenir.                                                               |
| CI               | GitHub Actions : qualité, build, migrations + seed + scraper sur Postgres de service | Bloque les PR cassées avant Vercel.                                                                                         |
| Indexation       | Seul `VERCEL_ENV=production` est indexable                                           | Éviter que les previews soient indexées (contenu dupliqué).                                                                 |
| Langue           | Français partout (UI, docs, commits) ; identifiants de code en anglais               | Public francophone ; conventions de code universelles.                                                                      |

## Questions encore ouvertes

Reprises du cahier des charges, à trancher puis à consigner ici :

- Nom de domaine (et extension `.fr` ou `.com`).
- Site en français seul ou aussi en anglais ? (impact SEO : `hreflang`, structure `/en/`)
- Droits sur les photos : demander l'autorisation aux services presse (liens directs en attendant).
