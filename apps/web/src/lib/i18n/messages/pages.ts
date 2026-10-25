/** Pages publiques : textes communs aux cinq langues, sans contenu HTML dans les traductions. */
const fr = {
  notFound: {
    title: "Page introuvable",
    description: "Cette montre ou cette page n'existe pas, ou plus à cette adresse.",
    browse: "Voir toutes les montres",
  },
  about: {
    metaTitle: "À propos : un comparateur de montres indépendant",
    metaDescription:
      "Aiguille est un projet personnel, gratuit et non commercial : ni publicité, ni affiliation, ni vente. Découvrez le projet et comment nous contacter.",
    breadcrumb: "À propos",
    title: "À propos d'{site}",
    whyTitle: "Pourquoi ce site",
    why: "Choisir une montre de milieu de gamme demande de comparer des centaines de références, dont les prix changent et dont les avis sont dispersés. {site} rassemble les données utiles au même endroit : prix, caractéristiques, disponibilité et historique des prix.",
    independenceTitle: "Indépendant et non commercial",
    noAds: "Aucune publicité, aucun lien d'affiliation, aucune vente.",
    noBusiness: "Aucun lien commercial avec les marques ou les revendeurs cités.",
    links:
      "Les liens vers les sites des marques sont fournis pour vérifier nos données, sans rémunération.",
    methodIntro: "Les données et leur mode de collecte sont détaillés dans la",
    method: "méthodologie",
    contactTitle: "Contact",
    contactIntro:
      "Une erreur, une question, ou une marque qui souhaite le retrait d'un visuel ? Ouvrez un ticket sur",
    repository: "le dépôt GitHub du projet",
    contactEnd: "Les demandes de retrait sont traitées sans délai.",
  },
  europe: {
    metaTitle: "Prix des montres en Europe : où acheter moins cher ?",
    metaDescription:
      "Écart de prix médian avec la France pour Tissot, Hamilton et Longines dans 14 pays européens, à partir des prix officiels convertis en euros.",
    breadcrumb: "Prix en Europe",
    title: "Prix des montres en Europe",
    intro:
      "Pour chaque marque et chaque pays, écart médian entre le prix catalogue officiel national (converti en euros) et le prix français des mêmes références. Les prix étrangers incluent la TVA locale ; acheter à l'étranger implique d'y acheter sur place et d'y faire valoir la garantie.",
    empty:
      "Les prix nationaux sont en cours de relevé : chaque pays est revu une fois par semaine.",
    cheapest:
      "Après conversion en euros, les montres {brand} sont les moins chères dans le pays suivant : {country} ({delta} en médiane par rapport à la France).",
    priciest: "Les prix les plus élevés sont relevés dans le pays suivant : {country} ({delta}).",
    aligned: "Les prix {brand} sont alignés sur la France dans les pays relevés.",
    mapValue: "{delta} en médiane ({count} montres)",
    country: "Pays",
    delta: "Écart médian avec la France",
    compared: "Montres comparées",
    stock: "En stock sur le site national",
    rates: "Conversion au taux de référence de la BCE du {date}.",
  },
};

type Messages = typeof fr;

const en: Messages = {
  notFound: {
    title: "Page not found",
    description: "This watch or page does not exist, or is no longer at this address.",
    browse: "Browse all watches",
  },
  about: {
    metaTitle: "About: an independent watch comparison site",
    metaDescription:
      "Aiguille is a free, non-commercial personal project: no advertising, affiliate links or sales. Learn about the project and how to contact us.",
    breadcrumb: "About",
    title: "About {site}",
    whyTitle: "Why this site exists",
    why: "Choosing a mid-range watch means comparing hundreds of references, with changing prices and scattered reviews. {site} brings useful data together: prices, specifications, availability and price history.",
    independenceTitle: "Independent and non-commercial",
    noAds: "No advertising, affiliate links or sales.",
    noBusiness: "No commercial ties with the brands or retailers mentioned.",
    links: "Links to brand websites help you check our data. We receive no payment for them.",
    methodIntro: "Our data and collection methods are detailed in our",
    method: "methodology",
    contactTitle: "Contact",
    contactIntro:
      "Found an error, have a question, or represent a brand requesting image removal? Open an issue on",
    repository: "the project's GitHub repository",
    contactEnd: "Removal requests are handled promptly.",
  },
  europe: {
    metaTitle: "Watch prices in Europe: where to buy for less?",
    metaDescription:
      "Median price differences with France for Tissot, Hamilton and Longines in 14 European countries, using official list prices converted to euros.",
    breadcrumb: "Prices in Europe",
    title: "Watch prices in Europe",
    intro:
      "For each brand and country, the median difference between the national official list price (converted to euros) and the French price for the same references. Foreign prices include local VAT; buying abroad means purchasing locally and claiming warranty service there.",
    empty: "National prices are being collected: each country is checked once a week.",
    cheapest:
      "After conversion to euros, {brand} watches are cheapest in the following country: {country} ({delta} median difference with France).",
    priciest: "The highest prices are found in the following country: {country} ({delta}).",
    aligned: "{brand} prices match those in France across the countries checked.",
    mapValue: "{delta} median difference ({count} watches)",
    country: "Country",
    delta: "Median difference with France",
    compared: "Watches compared",
    stock: "In stock on the national website",
    rates: "Converted at the ECB reference rate of {date}.",
  },
};

const de: Messages = {
  notFound: {
    title: "Seite nicht gefunden",
    description:
      "Diese Uhr oder Seite existiert nicht oder ist nicht mehr unter dieser Adresse verfügbar.",
    browse: "Alle Uhren ansehen",
  },
  about: {
    metaTitle: "Über uns: unabhängiger Uhrenvergleich",
    metaDescription:
      "Aiguille ist ein kostenloses, nicht kommerzielles Privatprojekt: keine Werbung, Affiliate-Links oder Verkäufe. Projekt und Kontaktmöglichkeiten.",
    breadcrumb: "Über uns",
    title: "Über {site}",
    whyTitle: "Warum es diese Website gibt",
    why: "Bei der Wahl einer Uhr der mittleren Preisklasse müssen Hunderte Referenzen mit wechselnden Preisen und verstreuten Bewertungen verglichen werden. {site} bündelt nützliche Daten: Preise, technische Merkmale, Verfügbarkeit und Preisverlauf.",
    independenceTitle: "Unabhängig und nicht kommerziell",
    noAds: "Keine Werbung, keine Affiliate-Links, kein Verkauf.",
    noBusiness: "Keine Geschäftsbeziehungen zu den genannten Marken oder Händlern.",
    links: "Links zu Markenwebsites dienen der Überprüfung unserer Daten, ohne Vergütung.",
    methodIntro: "Unsere Daten und deren Erhebung erläutern wir in der",
    method: "Methodik",
    contactTitle: "Kontakt",
    contactIntro:
      "Ein Fehler, eine Frage oder eine Marke, die ein Bild entfernen lassen möchte? Erstellen Sie ein Ticket im",
    repository: "GitHub-Repository des Projekts",
    contactEnd: "Anfragen zur Entfernung werden umgehend bearbeitet.",
  },
  europe: {
    metaTitle: "Uhrenpreise in Europa: wo günstiger kaufen?",
    metaDescription:
      "Mediane Preisabweichung zu Frankreich für Tissot, Hamilton und Longines in 14 europäischen Ländern, anhand offizieller Listenpreise in Euro.",
    breadcrumb: "Preise in Europa",
    title: "Uhrenpreise in Europa",
    intro:
      "Für jede Marke und jedes Land: mediane Abweichung zwischen dem nationalen offiziellen Listenpreis (in Euro umgerechnet) und dem französischen Preis derselben Referenzen. Auslandspreise enthalten die lokale MwSt.; Kauf und Garantieabwicklung erfolgen vor Ort.",
    empty:
      "Die nationalen Preise werden derzeit erfasst: jedes Land wird einmal pro Woche geprüft.",
    cheapest:
      "Nach Umrechnung in Euro sind {brand}-Uhren in folgendem Land am günstigsten: {country} ({delta} mediane Abweichung zu Frankreich).",
    priciest: "Die höchsten Preise wurden in folgendem Land erfasst: {country} ({delta}).",
    aligned: "Die Preise von {brand} entsprechen in den erfassten Ländern denen in Frankreich.",
    mapValue: "{delta} mediane Abweichung ({count} Uhren)",
    country: "Land",
    delta: "Mediane Abweichung zu Frankreich",
    compared: "Verglichene Uhren",
    stock: "Auf der nationalen Website lieferbar",
    rates: "Umrechnung zum EZB-Referenzkurs vom {date}.",
  },
};

const it: Messages = {
  notFound: {
    title: "Pagina non trovata",
    description:
      "Questo orologio o questa pagina non esiste, o non è più disponibile a questo indirizzo.",
    browse: "Vedi tutti gli orologi",
  },
  about: {
    metaTitle: "Chi siamo: confronto indipendente di orologi",
    metaDescription:
      "Aiguille è un progetto personale gratuito e non commerciale: niente pubblicità, affiliazioni o vendite. Scopri il progetto e come contattarci.",
    breadcrumb: "Chi siamo",
    title: "Informazioni su {site}",
    whyTitle: "Perché questo sito",
    why: "Scegliere un orologio di fascia media richiede di confrontare centinaia di referenze, con prezzi variabili e recensioni sparse. {site} riunisce i dati utili: prezzi, caratteristiche, disponibilità e storico dei prezzi.",
    independenceTitle: "Indipendente e non commerciale",
    noAds: "Nessuna pubblicità, nessun link di affiliazione, nessuna vendita.",
    noBusiness: "Nessun rapporto commerciale con i marchi o i rivenditori citati.",
    links: "I link ai siti dei marchi servono a verificare i nostri dati, senza compensi.",
    methodIntro: "I dati e le modalità di raccolta sono descritti nella",
    method: "metodologia",
    contactTitle: "Contatti",
    contactIntro:
      "Un errore, una domanda o un marchio che desidera la rimozione di un'immagine? Apri una segnalazione su",
    repository: "GitHub, nel repository del progetto",
    contactEnd: "Le richieste di rimozione vengono gestite tempestivamente.",
  },
  europe: {
    metaTitle: "Prezzi degli orologi in Europa: dove risparmiare?",
    metaDescription:
      "Differenza mediana di prezzo rispetto alla Francia per Tissot, Hamilton e Longines in 14 paesi europei, dai prezzi ufficiali convertiti in euro.",
    breadcrumb: "Prezzi in Europa",
    title: "Prezzi degli orologi in Europa",
    intro:
      "Per ogni marchio e paese, differenza mediana tra il prezzo di listino ufficiale nazionale (convertito in euro) e quello francese delle stesse referenze. I prezzi esteri includono l'IVA locale; l'acquisto e la garanzia si effettuano sul posto.",
    empty:
      "I prezzi nazionali sono in fase di raccolta: ogni paese viene controllato una volta alla settimana.",
    cheapest:
      "Dopo la conversione in euro, gli orologi {brand} costano meno nel seguente paese: {country} ({delta} di differenza mediana rispetto alla Francia).",
    priciest: "I prezzi più alti sono rilevati nel seguente paese: {country} ({delta}).",
    aligned: "I prezzi {brand} sono allineati a quelli francesi nei paesi rilevati.",
    mapValue: "{delta} di differenza mediana ({count} orologi)",
    country: "Paese",
    delta: "Differenza mediana rispetto alla Francia",
    compared: "Orologi confrontati",
    stock: "Disponibili sul sito nazionale",
    rates: "Conversione al tasso di riferimento della BCE del {date}.",
  },
};

const es: Messages = {
  notFound: {
    title: "Página no encontrada",
    description: "Este reloj o esta página no existe, o ya no está disponible en esta dirección.",
    browse: "Ver todos los relojes",
  },
  about: {
    metaTitle: "Acerca de: comparador de relojes independiente",
    metaDescription:
      "Aiguille es un proyecto personal gratuito y no comercial: sin publicidad, afiliación ni ventas. Descubre el proyecto y cómo contactarnos.",
    breadcrumb: "Acerca de",
    title: "Acerca de {site}",
    whyTitle: "Por qué existe este sitio",
    why: "Elegir un reloj de gama media requiere comparar cientos de referencias, con precios cambiantes y opiniones dispersas. {site} reúne los datos útiles: precios, características, disponibilidad e historial de precios.",
    independenceTitle: "Independiente y no comercial",
    noAds: "Sin publicidad, enlaces de afiliación ni ventas.",
    noBusiness: "Sin relación comercial con las marcas o los distribuidores mencionados.",
    links:
      "Los enlaces a los sitios de las marcas permiten comprobar nuestros datos, sin remuneración.",
    methodIntro: "Los datos y su recopilación se detallan en la",
    method: "metodología",
    contactTitle: "Contacto",
    contactIntro:
      "¿Un error, una pregunta o una marca que solicita retirar una imagen? Abre una incidencia en",
    repository: "el repositorio GitHub del proyecto",
    contactEnd: "Las solicitudes de retirada se atienden sin demora.",
  },
  europe: {
    metaTitle: "Precios de relojes en Europa: ¿dónde ahorrar?",
    metaDescription:
      "Diferencia mediana de precio con Francia para Tissot, Hamilton y Longines en 14 países europeos, según los precios oficiales convertidos a euros.",
    breadcrumb: "Precios en Europa",
    title: "Precios de relojes en Europa",
    intro:
      "Para cada marca y país, diferencia mediana entre el precio de catálogo oficial nacional (convertido a euros) y el francés de las mismas referencias. Los precios extranjeros incluyen el IVA local; la compra y la garantía se gestionan allí.",
    empty: "Se están recopilando los precios nacionales: cada país se revisa una vez por semana.",
    cheapest:
      "Tras la conversión a euros, los relojes {brand} son más baratos en el siguiente país: {country} ({delta} de diferencia mediana con Francia).",
    priciest: "Los precios más altos se registran en el siguiente país: {country} ({delta}).",
    aligned: "Los precios de {brand} coinciden con los de Francia en los países consultados.",
    mapValue: "{delta} de diferencia mediana ({count} relojes)",
    country: "País",
    delta: "Diferencia mediana con Francia",
    compared: "Relojes comparados",
    stock: "En stock en el sitio nacional",
    rates: "Conversión al tipo de referencia del BCE del {date}.",
  },
};

export const pages = { fr, en, de, it, es };
