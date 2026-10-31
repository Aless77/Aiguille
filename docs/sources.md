# Sources de données

## Règles de collecte (non négociables)

1. **Vérifier avant d'ajouter une source** : robots.txt, CGU, présence d'une API officielle. Noter le
   résultat dans le registre ci-dessous, avec la date.
2. **Rythme lent** : au plus 1 requête toutes les quelques secondes par domaine (une requête à la fois,
   4 s minimum entre deux départs garantis par `lib/throttle.ts`, ou le Crawl-delay du site s'il est
   plus long), aucune parallélisation sur un même site.
3. **User-Agent identifiable** : `SCRAPER_USER_AGENT`, avec un lien vers une page qui explique le
   projet et donne un contact.
4. **Avis tiers** : seulement la note agrégée, le nombre d'avis et un lien vers la source.
   Jamais le texte d'un avis.
5. **Stockage minimal** : un relevé n'est enregistré que si le prix ou le stock change.
6. **Robustesse** : un adaptateur par source, sortie validée par Zod, alerte si une source renvoie
   zéro résultat (structure de page changée ou blocage).
7. **Images** : ne pas republier les photos des marques et revendeurs sans droit. À trancher avant
   le lot 2 (voir les questions ouvertes ci-dessous).
8. **Disjoncteur** : ne jamais insister auprès d'un site en panne, en maintenance ou qui demande de
   ralentir (`lib/availability.ts`).
   - robots.txt ou sitemap en 5xx, 429 ou injoignable : source indisponible d'emblée. Pour
     robots.txt, c'est la règle de la RFC 9309 (tout est alors interdit).
   - Pendant la visite : 10 erreurs serveur d'affilée (5xx, 429, réseau ; tentatives comprises)
     arrêtent le crawler. Une réponse valide remet le compteur à zéro.
   - Effet : exécution `failed` dans `scrape_runs` avec le message « Source indisponible : … »,
     avertissement dans GitHub Actions, étapes suivantes de la même source sautées (autres
     pays). La tâche ne passe pas en échec (pas d'e-mail) : nouvel essai la nuit suivante.
   - Une source cassée (zéro résultat, pages illisibles) reste, elle, une erreur qui fait
     échouer la tâche.

## Registre des sources

| Source                                                          | Données                | Méthode                        | Fréquence                           | robots.txt / CGU vérifiés                                 | Statut                                              |
| --------------------------------------------------------------- | ---------------------- | ------------------------------ | ----------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| Tissot (site officiel)                                          | Catalogue, prix, specs | Cheerio, JSON-LD               | Quotidienne                         | robots ✅ 2026-10-18, CGU à lire                          | Lot 2 ✅                                            |
| Hamilton (site officiel)                                        | Catalogue, prix, specs | Cheerio, JSON-LD               | Quotidienne                         | robots ✅ 2026-10-18, CGU à lire                          | Lot 2 ✅                                            |
| Longines (site officiel)                                        | Catalogue, prix, specs | JSON-LD + **NEXT_DATA**        | Quotidienne                         | robots ✅ 2026-10-18, CGU à lire                          | Lot 2 ✅                                            |
| Lepage (lepage.fr)                                              | Prix réel, stock       | JSON-LD (sku = référence)      | Quotidienne                         | robots ✅ 2026-10-19, CGU à lire                          | Lot 3 – prioritaire                                 |
| Ocarat (ocarat.com)                                             | Prix réel, stock       | JSON-LD + référence dans l'URL | Quotidienne                         | robots ✅ 2026-10-19, CGU à lire                          | Lot 3                                               |
| Histoire d'Or                                                   | —                      | —                              | —                                   | robots ✅ 2026-10-19                                      | Écarté : ne vend aucune des 3 marques               |
| Citizen (site officiel français)                                | Catalogue, prix, specs | Cheerio, HTML et JSON-LD       | Quotidienne                         | Vérifiés le 2026-10-25, voir étude ci-dessous             | Intégration locale, collecte quotidienne configurée |
| Seiko (site officiel)                                           | Catalogue, prix, specs | Cheerio, HTML                  | Quotidienne                         | Vérifiés le 2026-10-25, voir étude ci-dessous             | Intégration locale, collecte quotidienne configurée |
| Venezianico (site officiel)                                     | Catalogue, prix, specs | Cheerio, JSON-LD et HTML       | Quotidienne, 20 s entre deux fiches | Vérifiés le 2026-10-31, CGU section 2 : voir decisions.md | Collecte activée par le propriétaire                |
| Lip (site officiel, `lip.fr`)                                   | Catalogue, prix, specs | Cheerio, JSON-LD et HTML       | Quotidienne                         | Vérifiés le 2026-10-31, mentions légales : voir decisions | Collecte activée par le propriétaire                |
| WatchBase                                                       | Calibres, specs        | Scraping lent                  | Mensuelle                           | à faire                                                   | Lot 2                                               |
| eBay Browse API                                                 | Prix d'occasion        | API (5 000 appels/j)           | Quotidienne                         | API officielle                                            | Lot 3                                               |
| Wayback Machine                                                 | Prix catalogue passés  | API archive.org                | Une fois                            | à valider                                                 | Lot 3                                               |
| Frankfurter (BCE)                                               | Taux de change         | API                            | Quotidienne                         | API ouverte                                               | Lot 3                                               |
| Nominatim (OSM) — inutile, coordonnées publiées par les marques | Géocodage boutiques    | API, cache permanent           | Une fois / adresse                  | politique d'usage OSM (1 req/s)                           | Lot 4                                               |

## Étude Citizen → Oris → Seiko (25 octobre 2026)

Analyse technique et plan détaillé : [analyse-citizen-oris-seiko.md](analyse-citizen-oris-seiko.md).
Constats de l’étude initiale, avant la décision d’intégration :

État actualisé après décision du propriétaire : adaptateurs Citizen et Seiko ajoutés au code et
à la configuration quotidienne, avec collecte locale de validation. Oris est écartée ; les
réserves du tableau décrivent l’étude initiale. Les pages officielles des deux marques retenues
fournissent les faits et traductions ; les API Citizen interdites et la boutique Seiko protégée
ne sont pas sollicitées. Aucun droit spécifique de republication n’est présumé.

| Source                                 | Constat technique                                                                                                 | Robots / conditions                                                                                                                        | Statut                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Citizen France, `fr.citizenwatch.eu`   | Sitemap produits de 148 URL ; HTML et Product/Offer sur deux fiches testées ; attributs techniques à clés stables | Robots lu : fiches permises, API/AJAX et stock par revendeur interdits ; CGV et mentions légales lues, droits de réutilisation à clarifier | Première intégration à préparer                                                          |
| Citizen Europe, `citizenwatch.eu`      | Sitemap produits de 430 URL ; traduction anglaise disponible sur l’exemple TSUYOSA                                | Robots lu ; un catalogue européen ne prouve ni commercialisation française ni prix britannique                                             | Complément de langue, marchés à valider                                                  |
| Oris, `www.oris.ch`                    | HTML et données Nuxt ; versions nationales et sitemap paginé                                                      | Robots lu : combinaisons pays/langues limitées ; CGU section 2 interdisant la présentation du contenu sur un autre site                    | Source officielle non activable en l’état ; autorisation ou source alternative à établir |
| Seiko, `www.seikowatches.com`          | Sitemap FR de 2 129 URL mixtes ; prix et spécifications présents dans le HTML Prospex testé                       | Robots lu, sans restriction de chemin ; conditions d’utilisation encadrant l’usage secondaire sans autorisation                            | HTML à privilégier sur ce périmètre, droits à clarifier                                  |
| Boutique Seiko, `www.seikoboutique.eu` | Source de prix/stock complémentaire potentielle ; sitemap protégé par Cloudflare 403 depuis Docker                | Robots lu, recherche/chemins privés interdits ; accès et conditions à compléter                                                            | Pas de contournement ; source non activée                                                |

Les nombres sont des URL de sitemaps à la date de l’étude, pas des décomptes de montres actives.
Pour Seiko, l’hypothèse « Playwright nécessaire » du registre initial n’est pas confirmée sur les
fiches testées : le navigateur n’est à envisager que pour les données réellement absentes du HTML.

## Prix nationaux et boutiques (lot 4, 2026-10-19)

| Marque   | Versions nationales relevées                                                                               | Boutiques                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Tissot   | 14 pays (fr-fr, de-de, it-it, es-es, nl-nl, fr-be, de-at, pt-pt, en-ie, fr-ch, en-gb, en-se, en-dk, pl-pl) | ❌ localisateur interdit (robots.txt)                                                 |
| Hamilton | 12 pays (pas de PT ni PL)                                                                                  | ✅ sitemaps nationaux, pages `store-locator`, JSON-LD JewelryStore (~2 100 en Europe) |
| Longines | 13 pays (pas d'IE)                                                                                         | ✅ `/fr/sitemap/stores.xml` (~4 000 dans le monde), JSON-LD Store                     |

- **Taux de change** : `api.frankfurter.dev/v1` (taux de référence BCE), une fois par jour.
- **Rythme** : mêmes règles que les fiches (4 s, une requête à la fois, robots.txt lu avec notre
  User-Agent). Un pays par exécution et par marque, journalisé `<marque>-officiel@<PAYS>`.

## Étude des revendeurs (2026-10-19)

|                                  | Lepage                                                      | Ocarat                                        | Histoire d'Or                   |
| -------------------------------- | ----------------------------------------------------------- | --------------------------------------------- | ------------------------------- |
| robots.txt                       | Fiches autorisées (filtres, panier, recherche interdits)    | Idem (PrestaShop)                             | Idem ; site derrière Cloudflare |
| Découverte                       | Sitemaps `1_fr_0/1_sitemap.xml` (URL en CDATA)              | Sitemaps `lgsitemaps … product_1_fr_1..3`     | 217 sitemaps, 32 321 fiches     |
| Tissot / Hamilton / Longines     | 497 / 453 / 646 fiches                                      | ~400 / ~760 / 0 (extrapolé de 1/3 du sitemap) | 0 / 0 / 0                       |
| Référence marque                 | `sku` et `mpn` du JSON-LD, et fin d'URL                     | Nom et URL (`sku` = identifiant interne)      | —                               |
| EAN (GTIN-13)                    | Oui                                                         | Oui                                           | —                               |
| Prix, disponibilité              | JSON-LD `offers` (InStock, PreOrder…)                       | JSON-LD `offers`                              | —                               |
| Rapprochées avec notre catalogue | Tissot 364, Hamilton 259, Longines 325+ (collecte en cours) | Tissot 74, Hamilton 51 (sur 1/3)              | —                               |
| Durée d'une collecte (4 s/fiche) | ~1 h 45                                                     | ~1 h 15                                       | —                               |

Règles retenues pour les revendeurs :

- **Rapprochement par référence** (`reference_key`), l'EAN servant de vérification. Une fiche revendeur
  sans montre correspondante chez nous (ancien modèle, autre marché) est ignorée : le catalogue reste
  défini par les sites officiels.
- **Pas de note revendeur** : l'`aggregateRating` d'Ocarat porte sur la boutique, pas sur la montre.
- Un relevé par revendeur et par montre, avec la même règle « seulement si le prix ou le stock change ».

## Vérification manuelle garantie et entretien (24 octobre 2026)

Pages officielles consultées pour le registre éditorial, sans nouvelle collecte automatique :

- Tissot : [garantie et précautions](https://www.tissotwatches.com/fr-fr/customer-service-warranty.html),
  [tarifs France](https://www.tissotwatches.com/fr-fr/service-prices),
  [FAQ](https://www.tissotwatches.com/fr-fr/faq). Pages maintenant lisibles ; fréquences
  divergentes conservées avec leurs sources (voir décisions).
- Hamilton : [interventions et prix](https://www.hamiltonwatch.com/fr-fr/watch-intervention.html).
  Grille et fréquences confirmées ; les règles de collecte existantes restent applicables.
- Longines : [garantie](https://www.longines.com/fr/customer-service/warranty),
  [tarifs](https://www.longines.com/fr/customer-service/services/maintenance-prices),
  [services](https://www.longines.com/fr/customer-service/services). Restriction géographique du
  forfait pile et devis pour les montres anciennes pris en compte.

## Questions restant à trancher

- Couverture de Citizen et Seiko chez les revendeurs suivis ; Oris écartée.
- Sources d'avis externes autorisées, par marque.
- Photos : liens directs vers les images des marques, photos libres de droits, ou visuels propres ?
