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

### Fiche technique commune (`packages/db/src/spec-sheet.ts`)

Toutes les marques affichent **les mêmes rubriques et les mêmes lignes, dans le même ordre**
(Mouvement, Boîtier, Cadran, Bracelet, Garantie et entretien, et Historique pour les pièces
vintage). Chaque ligne liste les libellés de fiche qui l'alimentent, toutes marques confondues.
Pour une nouvelle marque :

- ajouter ses libellés aux lignes correspondantes (`raw("Libellé Tissot", "Libellé Longines", …)`) ;
- vérifier la section « Fiche technique » du rapport de couverture : une ligne à 0 % signale un
  libellé non relié ou une information non publiée ;
- ouvrir une fiche : le bloc repliable « Autres informations » liste les libellés de la marque
  encore non reliés à une ligne. Les relier, ou les ajouter à `IGNORED` s'ils sont sans intérêt ;
- ne jamais ajouter une ligne pour une seule marque : une nouvelle ligne vaut pour toutes.

Les libellés et valeurs sont normalisés en Unicode NFC (certaines marques écrivent des accents
décomposés) : écrire les libellés tels qu'ils s'affichent.

### Déclinaisons d'un modèle (`packages/db/src/variants.ts`)

La fiche propose les autres cadrans, matières et bracelets du même modèle, et ses autres tailles.
Le regroupement lit la partie « modèle » de la référence : ajouter à `MODEL_KEYS` le motif de la
marque (par exemple `H32705` pour `H32705141` chez Hamilton), avec un test dans `variants.test.ts`.
Vérifier sur le site de la marque que deux références au même préfixe sont bien le même modèle.
Sans motif, la marque n'a simplement pas de sélecteur.

### Gammes officielles (`packages/db/src/collection-families.ts`)

Relever sur le site de la marque comment elle regroupe ses collections (menu « Montres », pages
de collection) et le reporter tel quel : nom de la gamme, page officielle, collections membres
(slugs Aiguille), avec la source et la date. Ne créer aucune gamme que la marque ne présente pas :
une marque à plat (Hamilton) est déclarée avec une liste vide. `complete: true` quand toute
collection doit appartenir à une gamme ; le rapport de couverture liste alors les collections à
rattacher, et pour toutes les marques les slugs devenus inconnus.

## 4. Renseigner les informations de marque (`packages/db/src/brand-info.ts`)

Ce que les fiches ne donnent pas, **avec la page source et la date de vérification**. Pages à
chercher sur chaque site : conditions de garantie, conditions générales de vente (garantie,
disponibilité des pièces détachées), service client (tarifs de révision), FAQ et conseils
d'entretien.

| Champ            | Contenu                                                                                                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `warranty`       | Durée standard et durées étendues, **page de détail** (lien sur la fiche), exclusions résumées                                                                                                                                                       |
| `service`        | Tarifs de révision complète et partielle (mécanique / quartz, avec ou sans chronographe), pile, fréquences conseillées (complète, partielle, étanchéité), durée de vie de la pile, garantie de la révision, pièces de rechange, prestations offertes |
| `madeIn`         | Pays de fabrication déclaré pour toute la marque, si les fiches ne le donnent pas                                                                                                                                                                    |
| `care`           | Conseils d'utilisation que la marque publie (identifiants de `CARE_TIPS`)                                                                                                                                                                            |
| `movementMakers` | Fabricant du mouvement par motif de calibre, seulement si une page de la marque l'établit                                                                                                                                                            |

- Les textes sont **reformulés**, jamais copiés ; garder les chiffres exacts de la marque.
- Laisser `null` ou une liste vide tant que ce n'est pas vérifié : le site affiche alors « non
  communiqué ». Sans conseils de la marque, la fiche affiche des **conseils généraux**, signalés
  comme tels. Le rapport de couverture liste ce qui reste à sourcer et ce qui date de plus de six
  mois (à revérifier : les tarifs changent).

## 5. Recalculer et vérifier

```bash
docker compose run --rm tools npm run db:scores       # faits, comparaisons, base des calibres
docker compose run --rm tools npm run db:couverture   # ce qui manque encore
docker compose run --rm tools npm run check
```

Puis ouvrir quelques fiches : section « Fiche technique » (dont « Garantie et entretien » et les conseils) et « Aussi bien
équipées, pour moins cher ». Vérifier à la main 2 ou 3 alternatives proposées.

## 6. Documenter

- [sources.md](sources.md) : registre (robots.txt, CGU, statut).
- [decisions.md](decisions.md) : tout écart ou choix propre à la marque.
- [suivi.md](suivi.md) : couverture obtenue et informations restant à sourcer.
