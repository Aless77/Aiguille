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

| Source                   | Données                | Méthode                 | Fréquence          | robots.txt / CGU vérifiés        | Statut   |
| ------------------------ | ---------------------- | ----------------------- | ------------------ | -------------------------------- | -------- |
| Tissot (site officiel)   | Catalogue, prix, specs | Cheerio, JSON-LD        | Quotidienne        | robots ✅ 2026-10-18, CGU à lire | Lot 2 ✅ |
| Hamilton (site officiel) | Catalogue, prix, specs | Cheerio, JSON-LD        | Quotidienne        | robots ✅ 2026-10-18, CGU à lire | Lot 2 ✅ |
| Longines (site officiel) | Catalogue, prix, specs | JSON-LD + **NEXT_DATA** | Quotidienne        | robots ✅ 2026-10-18, CGU à lire | Lot 2 ✅ |
| Revendeurs FR            | Prix réel, stock       | Cheerio                 | Quotidienne        | à faire                          | Lot 3    |
| Seiko                    | Catalogue              | Playwright              | Quotidienne        | à faire                          | Lot 6    |
| WatchBase                | Calibres, specs        | Scraping lent           | Mensuelle          | à faire                          | Lot 2    |
| eBay Browse API          | Prix d'occasion        | API (5 000 appels/j)    | Quotidienne        | API officielle                   | Lot 3    |
| Wayback Machine          | Prix catalogue passés  | API archive.org         | Une fois           | à valider                        | Lot 3    |
| Frankfurter (BCE)        | Taux de change         | API                     | Quotidienne        | API ouverte                      | Lot 3    |
| Nominatim (OSM)          | Géocodage boutiques    | API, cache permanent    | Une fois / adresse | politique d'usage OSM (1 req/s)  | Lot 4    |

## Questions ouvertes liées aux sources

- Revendeurs de référence pour Oris et Citizen.
- Sources d'avis externes autorisées, par marque.
- Photos : liens directs vers les images des marques, photos libres de droits, ou visuels propres ?
