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

## Lot 5 en cours (20 octobre 2026)

- **Comptes** faits dans le code : Better Auth, connexion Google et GitHub, page `/connexion`,
  menu du compte dans l'en-tête, migration `0003`. Reste à créer les applications OAuth et les
  variables Vercel ([deploiement.md](deploiement.md#8-comptes--connexion-google-et-github-lot-5)).
- À faire ensuite : dépôt d'avis par critère (un par compte et par montre, Turnstile), puis note
  sur 100 avec confiance et détail des piliers. Contenu des piliers et sources externes à trancher.

## Prochaine étape : mise en production

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
