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

## Registre des sources

| Source                   | Données                | Méthode                        | Fréquence          | robots.txt / CGU vérifiés        | Statut                                |
| ------------------------ | ---------------------- | ------------------------------ | ------------------ | -------------------------------- | ------------------------------------- |
| Tissot (site officiel)   | Catalogue, prix, specs | Cheerio, JSON-LD               | Quotidienne        | robots ✅ 2026-10-18, CGU à lire | Lot 2 ✅                              |
| Hamilton (site officiel) | Catalogue, prix, specs | Cheerio, JSON-LD               | Quotidienne        | robots ✅ 2026-10-18, CGU à lire | Lot 2 ✅                              |
| Longines (site officiel) | Catalogue, prix, specs | JSON-LD + **NEXT_DATA**        | Quotidienne        | robots ✅ 2026-10-18, CGU à lire | Lot 2 ✅                              |
| Lepage (lepage.fr)       | Prix réel, stock       | JSON-LD (sku = référence)      | Quotidienne        | robots ✅ 2026-10-19, CGU à lire | Lot 3 – prioritaire                   |
| Ocarat (ocarat.com)      | Prix réel, stock       | JSON-LD + référence dans l'URL | Quotidienne        | robots ✅ 2026-10-19, CGU à lire | Lot 3                                 |
| Histoire d'Or            | —                      | —                              | —                  | robots ✅ 2026-10-19             | Écarté : ne vend aucune des 3 marques |
| Seiko                    | Catalogue              | Playwright                     | Quotidienne        | à faire                          | Lot 6                                 |
| WatchBase                | Calibres, specs        | Scraping lent                  | Mensuelle          | à faire                          | Lot 2                                 |
| eBay Browse API          | Prix d'occasion        | API (5 000 appels/j)           | Quotidienne        | API officielle                   | Lot 3                                 |
| Wayback Machine          | Prix catalogue passés  | API archive.org                | Une fois           | à valider                        | Lot 3                                 |
| Frankfurter (BCE)        | Taux de change         | API                            | Quotidienne        | API ouverte                      | Lot 3                                 |
| Nominatim (OSM)          | Géocodage boutiques    | API, cache permanent           | Une fois / adresse | politique d'usage OSM (1 req/s)  | Lot 4                                 |

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

## Questions ouvertes liées aux sources

- Revendeurs de référence pour Oris et Citizen.
- Sources d'avis externes autorisées, par marque.
- Photos : liens directs vers les images des marques, photos libres de droits, ou visuels propres ?
