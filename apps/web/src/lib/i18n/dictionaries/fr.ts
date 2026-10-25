import { pages } from "../messages/pages";
import { sections } from "../messages/sections";
import { catalog } from "../messages/catalog";
/**
 * Textes de l'interface, en français : la référence. L'anglais doit tout traduire (vérifié par
 * TypeScript) ; les autres langues peuvent être partielles, les manques s'affichent en anglais
 * avec un avertissement. Variables entre accolades : « {brand} », remplacées par `format`.
 */
export const fr = {
  common: {
    unknown: "Non communiqué",
    newTab: "(nouvel onglet)",
    close: "Fermer",
  },
  nav: {
    label: "Navigation principale",
    allWatches: "Toutes les montres",
    newArrivals: "Nouveautés",
    community: "Communauté",
    stores: "Boutiques",
  },
  footer: {
    label: "Liens du site",
    europePrices: "Prix en Europe",
    methodology: "Méthodologie",
    privacy: "Confidentialité",
    about: "À propos",
    independent:
      "{site} est un site gratuit, indépendant et sans publicité : aucune affiliation avec les marques ni les revendeurs.",
    sources:
      "Prix et caractéristiques relevés automatiquement sur les sites officiels des marques. Photos : © les marques respectives, affichées depuis leurs sites.",
  },
  language: {
    label: "Langue",
  },
  fallback: {
    ui: "Certains textes ne sont pas encore traduits en {language} : ils s'affichent en anglais.",
    content:
      "{brand} ne publie pas cette fiche en {language} : ses informations s'affichent en anglais.",
    contentSource:
      "{brand} ne publie pas cette fiche en {language} : ses informations s'affichent telles que publiées en français.",
  },
  availability: {
    in_stock: "En stock",
    out_of_stock: "Rupture de stock",
    preorder: "En précommande",
    unknown: "Disponibilité inconnue",
  },
  watch: {
    reference: "Référence {reference}",
    discontinued: "Plus produite",
    photo: "Photo : © {brand}",
    catalogPrice: "Prix catalogue officiel",
    availabilityOn: "{status} sur le site {brand}",
    bestPrice: "Meilleur prix relevé : ",
    alsoAt: "Aussi chez ",
    priceAt: "{price} chez {store}",
    observedOn: "Relevé sur le site {brand} le {date}.",
    ourMethod: "Notre méthode",
    seeOn: "Voir sur le site {brand}",
    seeInPerson: "Pour la voir en vrai :",
    stores: "{count} boutiques agréées {brand} en Europe",
    stockNotPublished: "(stock non publié par la marque).",
    otherModels: "Autres modèles {name}",
    otherModelsFallback: "Autres modèles",
    watches: "Montres",
    range: "Gamme {name}",
    collection: "Collection {name}",
    seeCollection: "Voir toute la collection",
    imageAlt: "{name}, référence {reference}",
    metaTitle: "{name} ({reference}) : prix et caractéristiques",
    summary: {
      intro: "La {name} (référence {reference}) est {kind}{diameter}",
      kinds: {
        automatique: "une montre automatique",
        manuel: "une montre à remontage manuel",
        quartz: "une montre à quartz",
        solaire: "une montre solaire",
        autre: "une montre",
        none: "une montre",
      },
      diameter: " de {mm}",
      caliber: "équipée du calibre {caliber}",
      water: "étanche à {m} m",
      reserve: "avec {h} heures de réserve de marche",
      price: " Prix catalogue officiel relevé : {price}.",
    },
  },
  variants: {
    label: "Déclinaisons de ce modèle",
    caseSize: "Taille du boîtier",
    count: "{count} déclinaisons",
    showMore: "Voir les {count} autres déclinaisons",
    hide: "Masquer",
    discontinued: "plus produite",
    dialColor: "Cadran",
    caseMaterial: "Boîtier",
    strapMaterial: "Bracelet",
  },
  specSheet: {
    title: "Fiche technique",
    intro:
      "Les informations publiées par {brand}, présentées de la même façon pour toutes les marques. « {unknown} » : la marque ne publie pas l'information.",
    navLabel: "Rubriques de la fiche technique",
    careNav: "Conseils d'entretien",
    vintage:
      "Pièce vintage vendue d'occasion par {brand} : son historique figure dans la rubrique « Historique ». Elle n'est pas comparée aux montres neuves.",
    careTitle: "Bien entretenir cette montre",
    careIntro:
      "Conseils adaptés à ses caractéristiques (couronne, chronographe, pile…), reformulés par Aiguille.",
    recommendedBy: "Recommandé par {brand}",
    generalTip: "Conseil général",
    others: "Autres informations publiées par {brand} ({count})",
    sources: "D'où viennent ces informations :",
    methodology: "notre méthodologie",
    groups: {
      mouvement: "Mouvement",
      boitier: "Boîtier",
      cadran: "Cadran",
      bracelet: "Bracelet",
      garantie: "Garantie et entretien",
      historique: "Historique",
    } as Record<string, string>,
    /** Libellés de lignes (packages/db/src/spec-sheet.ts), par libellé français. */
    rows: {} as Record<string, string>,
  },
  /** Textes des composants navigateur (transmis par LocaleProvider). */
  pages: pages.fr,
  catalog: catalog.fr,
  sections: sections.fr,
  client: {
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    myLists: "Mes listes de souhaits",
    myAccount: "Mon compte ({name})",
    close: "Fermer",
    country: {
      label: "Pays",
      placeholder: "Choisir un pays…",
      save: "Enregistrer",
      skip: "Ne pas préciser",
      saved: "Enregistré.",
      failed: "L'enregistrement a échoué. Réessayez.",
      hint: "Uniquement le pays, pour savoir d'où viennent nos visiteurs. Jamais votre adresse.",
      welcome: "Bienvenue ! Depuis quel pays nous rendez-vous visite ?",
    },
  },
};

export type Dictionary = typeof fr;
