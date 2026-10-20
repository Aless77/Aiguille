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
