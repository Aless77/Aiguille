# Données structurées (schema.org / JSON-LD)

Implémentation : `apps/web/src/lib/seo/json-ld.tsx`. Types fournis par `schema-dts`, sérialisation
via `serializeJsonLd` (échappe `<`). Un générateur par type de page, testé avec Vitest.

## Par type de page

| Page                          | Types                                            | Lot |
| ----------------------------- | ------------------------------------------------ | --- |
| Toutes                        | `WebSite`, `Organization` (layout racine) ✅     | 1   |
| Fiche montre                  | `Product` + `AggregateOffer` + `BreadcrumbList`  | 2-3 |
| Marque, collection, sélection | `CollectionPage` + `ItemList` + `BreadcrumbList` | 2   |
| Nouveautés                    | `ItemList`                                       | 3   |
| Avis utilisateurs             | `Review` et `AggregateRating` dans `Product`     | 5   |
| Méthodologie, à propos        | `AboutPage` / `WebPage`                          | 2   |

## Fiche montre : modèle

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Tissot PRX 40 Powermatic 80",
  "sku": "T137.407.11.041.00",
  "mpn": "T137.407.11.041.00",
  "brand": { "@type": "Brand", "name": "Tissot" },
  "image": ["https://<domaine>/images/t137-407-11-041-00.avif"],
  "description": "Montre automatique 40 mm, calibre Powermatic 80, 80 h de réserve de marche.",
  "url": "https://<domaine>/montres/tissot/prx/t137-407-11-041-00",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": 595,
    "highPrice": 725,
    "offerCount": 4,
    "availability": "https://schema.org/InStock"
  }
}
```

## Règles

- **`AggregateOffer`** et non `Offer` : nous ne vendons pas, nous agrégeons des offres de revendeurs.
  Pas d'éligibilité aux « fiches marchand » (merchant listings) ; on vise les extraits produit.
- `lowPrice` / `highPrice` = offres **actuelles** en stock, pas l'historique.
- **`AggregateRating` uniquement à partir des avis déposés sur Aiguille** (lot 5), avec
  `ratingCount` réel. Jamais à partir de notes d'autres sites (consignes Google) et jamais pour
  représenter notre note calculée sur 100.
- Le contenu balisé doit être **visible sur la page** (même prix, même nom).
- Pas de balisage `FAQPage` en espérant un extrait enrichi : Google le réserve à une liste restreinte
  de sites depuis 2023.
- Valider chaque nouveau gabarit avec le Rich Results Test et le Schema Markup Validator.
