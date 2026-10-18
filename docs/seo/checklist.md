# Checklist SEO – à chaque page publique

À vérifier dans toute PR qui ajoute ou modifie une page. Les agents de code l'appliquent
systématiquement (voir [AGENTS.md](../../AGENTS.md)).

## Métadonnées

- [ ] `generateMetadata` (ou `metadata`) avec un **`title` unique** ≤ 60 caractères, mot-clé principal en tête.
- [ ] `description` unique, ≤ 155 caractères, avec un chiffre concret quand c'est possible (prix, note).
- [ ] `alternates.canonical` : chemin propre, **sans paramètres de filtre**.
- [ ] Open Graph : `title`, `description`, image (générée ou par défaut).
- [ ] Page sans valeur de recherche (compte, formulaire, résultats filtrés) : `robots: { index: false, follow: true }`.

## Contenu et HTML

- [ ] Un seul `<h1>`, hiérarchie `h2`/`h3` logique.
- [ ] Les informations clés (prix, note, disponibilité, specs) sont **dans le HTML rendu côté
      serveur**, pas seulement dans un graphique ou un composant client.
- [ ] Tableaux de données en `<table>` sémantique.
- [ ] Liens internes en `<Link href>` (fil d'Ariane, pages parentes, pages proches) ; textes de lien descriptifs.
- [ ] Images via `next/image`, `alt` descriptif, dimensions fixées.
- [ ] Date de dernière mise à jour visible si les données changent.

## Données structurées

- [ ] JSON-LD adapté au type de page via `<JsonLd>` (voir [donnees-structurees.md](donnees-structurees.md)).
- [ ] `BreadcrumbList` sur toute page sous l'accueil.
- [ ] Validé avec le Rich Results Test sur la preview.

## Indexation

- [ ] URL en français, minuscules, tirets, stable. Changement d'URL existante : redirection 308.
- [ ] Page ajoutée à `sitemap.ts` si elle doit être indexée (et seulement dans ce cas).
- [ ] Garde-fou contenu mince respecté (fiche sans données = `noindex`).
- [ ] Statut HTTP correct : 404 via `notFound()` pour une ressource inexistante.

## Performance

- [ ] Pas de nouvelle librairie lourde chargée sur toutes les pages ; import dynamique si client-only.
- [ ] Pas de décalage de mise en page (espace réservé pour graphiques, cartes, images).
- [ ] Lighthouse mobile sur la preview : Performance ≥ 90, SEO = 100, Accessibilité ≥ 95.
