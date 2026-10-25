# Point de reprise

Mis à jour le 19 octobre 2026 à partir du bilan du propriétaire. Les données locales et les
services distants doivent être vérifiés avant de considérer un lot comme livré en ligne.

## État déclaré

- **Lot 1 – Socle** : monorepo npm, Next.js 16, PostgreSQL/Drizzle, Docker, qualité et CI en place.
  Projet Vercel créé ; base de production encore à connecter.
- **Lot 2 – Catalogue** : Tissot, Hamilton et Longines ; 1 573 montres annoncées dans la base locale
  (455, 292 et 826). Catalogue filtrable, fiches, marques, collections et SEO réalisés.
- **Lot 3 – Prix** : historique, stock, nouveautés, Lepage et Ocarat ; collecte quotidienne et
  invalidation du cache prévues par GitHub Actions, à vérifier en production.
- **Lot 4 – Carte** : prix dans 14 pays, conversion BCE, indice médian par rapport à la France,
  boutiques agréées Longines et Hamilton. Sans stock par boutique ; Tissot exclu conformément à
  son robots.txt. Les changements locaux du lot 4 sont à préserver.

Les lots 1 à 4 sont annoncés réalisés dans le code ; leur validation en ligne reste à faire.
Les nombres de tests et de références évoluent : utiliser les résultats des vérifications et la
base plutôt que figer ces chiffres comme critères.

## Constat en ligne (20 octobre 2026)

Site en production sur `aiguille.aless-villa.com`, avec la base locale copiée : catalogue complet
(1 573 montres, images affichées), 1 560 boutiques actives (Hamilton 1 112, Longines 448).

Reste pour boucler le lot 4 :

- **Prix étrangers** : seuls 3 modèles Tissot ont un prix hors de France (7 pays, essai limité).
  Hamilton et Longines n'apparaissent pas sur `/prix-en-europe`. La collecte quotidienne remplit
  2 pays par nuit et par marque, soit environ 7 nuits pour couvrir les 14 pays.
- **Boutiques en attente** : 2 776 Longines et 976 Hamilton pas encore visitées (400 par nuit et
  par marque), soit environ 7 nuits pour Longines.
- **Collecte quotidienne opérationnelle** depuis le 20 octobre 2026 : secrets et variables
  renseignés dans GitHub Actions et Vercel, essai manuel (`limit` = 5) réussi sur les 6 tâches,
  invalidation du cache du site confirmée. Première collecte complète la nuit suivante à 03:00 UTC.

## Lot 5 (21 octobre 2026)

- **Comptes** : Better Auth, connexion GitHub et Google (choix du compte forcé), pages
  `/connexion`, `/compte` (suppression du compte) et `/confidentialite`. GitHub actif en ligne ;
  Google à activer dans Vercel.
- **Note Aiguille** faite dans le code : sur 100, calculée dans la catégorie de la montre (gamme
  de prix × famille d'usage), à partir des faits des fiches officielles et de la base des calibres.
  Piliers mouvement 45 %, construction 30 %, rapport qualité-prix 25 %. Rang et catégorie affichés.
- **Avis de la communauté** fait dans le code : sur 5, affiché à part, un avis par compte et par
  montre (6 critères, design compris, notés par rapport au prix). Tri du catalogue par l'une ou
  l'autre note, `AggregateRating`, méthodologie. Migrations `0004` et `0005`. Modèle validé par le
  propriétaire ([decisions.md](decisions.md)).
- **24 octobre : Note Aiguille masquée** (`FEATURE_SCORE` absent ou autre que true), code conservé ;
  avis et connexion toujours affichés (masqués seulement si `FEATURE_REVIEWS=false`).
  À la place : section « Technique, garantie et entretien » et « Aussi bien équipées, pour moins
  cher » (685 montres avec au moins une alternative). Registre sourcé `brand-info.ts`, rapport
  `npm run db:couverture`, procédure [integrer-une-marque.md](integrer-une-marque.md).
  Migration `0006`.
- **Listes de souhaits et communauté** : listes privées, partagées par lien ou publiées sur
  /communaute avec avis et réponses des membres, anonymat possible, plafonds de stockage ;
  migrations `0007` et `0008` à appliquer en production (collecte
  `limit 1` ou build Vercel).
- **Déclinaisons** : sélecteur de cadrans, matières, bracelets et tailles du même modèle sur la
  fiche (Tissot, Longines, Hamilton), regroupé par la référence (`variants.ts`), une rangée
  visible et la suite repliée.
- **Gammes officielles** : Longines (5 univers), Tissot (7 collections emblématiques), Hamilton à
  plat ; page marque, page collection et fiche (`collection-families.ts`).
- **Fiche technique commune** : mêmes rubriques et lignes pour toutes les marques, « Autres
  informations » pour le reste ; remplissage ligne par ligne dans `npm run db:couverture`.
- Garantie, tarifs et conseils d'entretien relevés pour Longines et Hamilton (24 octobre).
- Tarifs et conseils Tissot complétés le 24 octobre : grilles mécanique/quartz/chronographe et
  tactile, liens officiels, exclusions, fréquences divergentes signalées. Forfaits vintage exclus ;
  solaire non extrapolé ; restriction du forfait pile Longines affichée.
- Reste à sourcer : fabricants de mouvements, calibres Tissot (absents des fiches). Longines : garantie
  (sur chaque fiche) et tarifs de révision relevés le 24 octobre.
- Hamilton refuse nos requêtes depuis le poste local (403, Akamai) et ses images s'y affichent
  « Photo indisponible » ; la collecte GitHub passait encore le 21 octobre. À surveiller.
- Plus tard : clés Turnstile si les avis sont réactivés, notes externes, cote en occasion (eBay).
- Vérification locale entretien (24 octobre) : contrôle qualité et build de production réussis ;
  10 parcours Playwright réussis (ordinateur/mobile, trois marques, liens et navigation vers la
  garantie). Captures Tissot relues. Léger débordement horizontal de l'en-tête à 393 px, hors du
  bloc entretien, à corriger séparément. Aucun déploiement effectué.

## Prochaine étape : mise en production

Recherche du 24 octobre : barre par nom/référence et curseurs prix/diamètre sur le catalogue,
les marques et les collections ; URL partageable, pagination dans le même périmètre, filtres
non indexés. Validation locale de la recherche, des références sans ponctuation, des bornes,
du clavier, de l'ouverture mobile, de la remise à zéro et des vrais 404. Code non déployé.

Déploiement du 24 octobre (`ad8ea95`, PR #20) en échec : `watch_scores` absente de la base
de production. Correction préparée dans `dev` : migrations avant le build Vercel de production
(`apps/web/vercel.json`), arrêt en cas d'échec ; previews sans migration automatique.
Commande exacte validée dans Docker (migrations puis build). Après commit/push et fusion par le
propriétaire, vérifier le nouveau déploiement Vercel. Aucune base distante modifiée par l'agent.

Suivre [deploiement.md](deploiement.md) et les choix de [decisions.md](decisions.md).

1. Connecter Neon au projet Vercel ; préparer le transfert de la base locale lorsque l'URL sera
   disponible dans `.env.neon` (fichier local ignoré par Git). Ne jamais afficher l'URL ou les secrets.
2. Configurer le sous-domaine prévu `aiguille.aless-villa.com` dans Vercel et chez Cloudflare,
   avec les valeurs DNS indiquées par Vercel et le mode « DNS only ».
3. Renseigner les variables et secrets de Vercel et de GitHub Actions, puis vérifier la collecte
   et le rafraîchissement du site.
4. Vérifier les CGU des sources et les critères d'acceptation des lots en ligne, dont le SEO.

Le propriétaire gère les commits, PR et fusions. Les agents restent sur la branche courante.

## Ensuite

- **Lot 5** : comptes, anti-spam, avis par critère et note explicable sur 100. Sources externes
  autorisées et poids des trois piliers encore à trancher.
- **Lot 6** : comparateur, exploration prix/note, Oris, Seiko et Citizen.
- **Lot 7**, optionnel : alertes de baisse de prix et analyse des avis.

Pour les messages de console liés aux extensions et à Docker, voir
[le diagnostic de développement](developpement.md#messages-de-console-du-navigateur).
