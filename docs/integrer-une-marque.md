# Intégrer une nouvelle marque

Procédure à suivre pour chaque marque ajoutée au site (Oris, Seiko, Citizen au lot 6…). Objectif :
que chaque fiche affiche les mêmes informations techniques, de garantie et d'entretien, et dise
clairement « non communiqué » quand la marque ne publie pas une donnée. **On n'invente rien** :
toute information vient d'une page publique, citée et datée.

## 1. Vérifier la source (avant toute ligne de code)

- robots.txt et conditions d'utilisation du site officiel ([sources.md](sources.md), règle 1).
- Repérer : sitemap des fiches produit, données structurées (JSON-LD), tableau de caractéristiques,
  page des **conditions de garantie**, éventuelle page **service et tarifs de révision**.
- Noter le résultat dans le registre de [sources.md](sources.md), avec la date.

## 2. Écrire l'adaptateur (`apps/scraper/src/sources/<marque>.ts`)

- `discover()` (sitemap), `parse()` (fonction pure, testée sur un extrait HTML réel).
- Remplir les champs normalisés : mouvement, calibre, diamètre, étanchéité, réserve de marche,
  matière, verre, prix, images.
- **Garder tout le tableau de caractéristiques dans `rawSpecs`** (libellé → valeur, tel quel) :
  c'est là que les faits techniques sont relus.

## 3. Relire les faits propres à la marque (`packages/db/src/facts.ts`)

Lancer le rapport de couverture :

```bash
docker compose run --rm tools npm run db:couverture
```

Pour chaque ligne faible, chercher le libellé utilisé par la marque dans `rawSpecs` et l'ajouter
aux règles d'extraction, avec un test dans `facts.test.ts` :

| Information                                                                                          | Règle à compléter                |
| ---------------------------------------------------------------------------------------------------- | -------------------------------- |
| Fréquence, spiral silicium, antimagnétisme, COSC, complications                                      | `extractMovementFacts`           |
| Fond transparent, couronne vissée, lunette céramique, luminescence                                   | `extractConstructionFacts`       |
| Garantie sur la fiche, pays de fabrication, pile, bracelet, mécanisme de chronographe, pièce vintage | `extractOwnershipFacts`          |
| Famille d'usage (plongée, habillée…)                                                                 | `family` (motifs de collections) |

## 4. Renseigner les informations de marque (`packages/db/src/brand-info.ts`)

Ce que les fiches ne donnent pas, **avec la page source et la date de vérification** :

- `warranty` : garantie internationale standard et durées étendues (conditions de garantie ou de
  vente de la marque).
- `movementMakers` : fabricant du mouvement par motif de calibre, seulement si une page publique
  l'établit (fiche, page calibre de la marque, communiqué).
- Laisser `null` ou une liste vide tant que ce n'est pas vérifié : le site affiche alors « non
  communiqué par la marque ». Le rapport de couverture liste ce qui reste à sourcer.

## 5. Recalculer et vérifier

```bash
docker compose run --rm tools npm run db:scores       # faits, comparaisons, base des calibres
docker compose run --rm tools npm run db:couverture   # ce qui manque encore
docker compose run --rm tools npm run check
```

Puis ouvrir quelques fiches : section « Technique, garantie et entretien » et « Aussi bien
équipées, pour moins cher ». Vérifier à la main 2 ou 3 alternatives proposées.

## 6. Documenter

- [sources.md](sources.md) : registre (robots.txt, CGU, statut).
- [decisions.md](decisions.md) : tout écart ou choix propre à la marque.
- [suivi.md](suivi.md) : couverture obtenue et informations restant à sourcer.
