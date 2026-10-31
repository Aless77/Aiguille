/**
 * Traductions des textes produits par ce paquet (fiche technique, informations de marque,
 * conseils, comparaisons). Le français reste la source dans le code ; chaque texte fixe a ici sa
 * traduction dans les autres langues du site (apps/web/src/lib/i18n/config.ts). Un test vérifie
 * que tout texte de brand-info.ts, CARE_TIPS, COMPLICATIONS et des comparaisons est traduit :
 * nouvelle marque ou nouveau texte = nouvelle entrée ici.
 */
export const LOCALES = ["fr", "en", "de", "it", "es"] as const;
export type Locale = (typeof LOCALES)[number];

type Translations = Record<Exclude<Locale, "fr">, string>;

const t = (en: string, de: string, it: string, es: string): Translations => ({ en, de, it, es });

/** Textes fixes, par texte français. */
export const TEXTS: Record<string, Translations> = {
  "verre et bracelet": t(
    "crystal and strap",
    "Glas und Armband",
    "vetro e cinturino",
    "cristal y correa",
  ),
  "bracelets non métalliques": t(
    "non-metal straps",
    "nichtmetallische Armbänder",
    "cinturini non metallici",
    "correas no metálicas",
  ),
  // Mouvements (fiche technique).
  "Mécanique automatique": t(
    "Automatic mechanical",
    "Mechanisch mit Automatikaufzug",
    "Meccanico automatico",
    "Mecánico automático",
  ),
  "Mécanique à remontage manuel": t(
    "Hand-wound mechanical",
    "Mechanisch mit Handaufzug",
    "Meccanico a carica manuale",
    "Mecánico de cuerda manual",
  ),
  Quartz: t("Quartz", "Quarz", "Quarzo", "Cuarzo"),
  "Quartz solaire": t("Solar quartz", "Solar-Quarz", "Quarzo solare", "Cuarzo solar"),
  Autre: t("Other", "Andere", "Altro", "Otro"),

  // Complications (facts.ts).
  Chronographe: t("Chronograph", "Chronograph", "Cronografo", "Cronógrafo"),
  "Second fuseau horaire (GMT)": t(
    "Second time zone (GMT)",
    "Zweite Zeitzone (GMT)",
    "Secondo fuso orario (GMT)",
    "Segundo huso horario (GMT)",
  ),
  "Phases de lune": t("Moon phases", "Mondphasen", "Fasi lunari", "Fases lunares"),
  "Calendrier annuel": t(
    "Annual calendar",
    "Jahreskalender",
    "Calendario annuale",
    "Calendario anual",
  ),
  "Calendrier perpétuel": t(
    "Perpetual calendar",
    "Ewiger Kalender",
    "Calendario perpetuo",
    "Calendario perpetuo",
  ),
  "Jour et date": t("Day and date", "Wochentag und Datum", "Giorno e data", "Día y fecha"),
  "Indicateur de réserve de marche": t(
    "Power reserve indicator",
    "Gangreserveanzeige",
    "Indicatore di riserva di carica",
    "Indicador de reserva de marcha",
  ),
  Alarme: t("Alarm", "Wecker", "Sveglia", "Alarma"),

  // Valeurs fixes de la fiche technique.
  "Sans objet (quartz)": t(
    "Not applicable (quartz)",
    "Entfällt (Quarz)",
    "Non applicabile (quarzo)",
    "No aplicable (cuarzo)",
  ),
  "Spiral en silicium, amagnétique": t(
    "Silicon hairspring, non-magnetic",
    "Siliziumspirale, amagnetisch",
    "Spirale in silicio, amagnetica",
    "Espiral de silicio, amagnética",
  ),
  "Spiral Nivachron, antimagnétique": t(
    "Nivachron hairspring, anti-magnetic",
    "Nivachron-Spirale, antimagnetisch",
    "Spirale Nivachron, antimagnetica",
    "Espiral Nivachron, antimagnética",
  ),
  Antimagnétique: t("Anti-magnetic", "Antimagnetisch", "Antimagnetico", "Antimagnético"),
  "Oui, COSC": t("Yes, COSC", "Ja, COSC", "Sì, COSC", "Sí, COSC"),
  Oui: t("Yes", "Ja", "Sì", "Sí"),
  "Non mentionnée": t("Not mentioned", "Nicht angegeben", "Non indicata", "No indicada"),
  "Non mentionné": t("Not mentioned", "Nicht angegeben", "Non indicato", "No indicado"),
  "Aucune mentionnée": t(
    "None mentioned",
    "Keine angegeben",
    "Nessuna indicata",
    "Ninguna indicada",
  ),
  "Accumulateur rechargé par la lumière": t(
    "Light-charged rechargeable cell",
    "Durch Licht aufgeladener Akku",
    "Accumulatore ricaricato dalla luce",
    "Acumulador recargado por la luz",
  ),
  "Indicateur de fin de vie de la pile.": t(
    "Battery end-of-life indicator.",
    "Batterie-Lebensdaueranzeige.",
    "Indicatore di fine vita della batteria.",
    "Indicador de fin de vida de la pila.",
  ),
  Céramique: t("Ceramic", "Keramik", "Ceramica", "Cerámica"),
  Transparent: t("Transparent", "Transparent", "Trasparente", "Transparente"),
  "Sans objet (rechargée par la lumière)": t(
    "Not applicable (charged by light)",
    "Entfällt (durch Licht aufgeladen)",
    "Non applicabile (ricaricata dalla luce)",
    "No aplicable (recargada por la luz)",
  ),
  "Détail de la garantie": t(
    "Warranty details",
    "Garantiebedingungen",
    "Dettagli della garanzia",
    "Detalles de la garantía",
  ),
  "Tarifs de la marque": t(
    "Brand prices",
    "Preise der Marke",
    "Tariffe del marchio",
    "Tarifas de la marca",
  ),
  "Recommandations de la marque": t(
    "Brand recommendations",
    "Empfehlungen der Marke",
    "Raccomandazioni del marchio",
    "Recomendaciones de la marca",
  ),
  "Conseils de la marque": t(
    "Brand advice",
    "Hinweise der Marke",
    "Consigli del marchio",
    "Consejos de la marca",
  ),

  // Conseils d'utilisation (brand-info.ts, CARE_TIPS).
  "Vissez la couronne à fond avant toute baignade.": t(
    "Screw the crown down fully before swimming.",
    "Schrauben Sie die Krone vor dem Baden vollständig fest.",
    "Avvitate a fondo la corona prima di fare il bagno.",
    "Enrosque la corona a fondo antes de bañarse.",
  ),
  "Après un réglage, repoussez toujours la couronne en position neutre.": t(
    "After setting the watch, always push the crown back to its neutral position.",
    "Drücken Sie die Krone nach dem Einstellen immer in die Grundposition zurück.",
    "Dopo una regolazione, riportate sempre la corona in posizione neutra.",
    "Tras un ajuste, vuelva a colocar siempre la corona en posición neutra.",
  ),
  "N'actionnez pas les poussoirs du chronographe sous l'eau.": t(
    "Do not operate the chronograph pushers under water.",
    "Betätigen Sie die Chronographendrücker nicht unter Wasser.",
    "Non azionate i pulsanti del cronografo sott'acqua.",
    "No accione los pulsadores del cronógrafo bajo el agua.",
  ),
  "Rincez la montre à l'eau claire après la mer ou la piscine.": t(
    "Rinse the watch in fresh water after the sea or a pool.",
    "Spülen Sie die Uhr nach Meer oder Schwimmbad mit klarem Wasser ab.",
    "Sciacquate l'orologio con acqua dolce dopo il mare o la piscina.",
    "Enjuague el reloj con agua dulce después del mar o la piscina.",
  ),
  "Tenez-la à distance des aimants et appareils électriques (enceintes, portiques…).": t(
    "Keep it away from magnets and electrical devices (speakers, security gates…).",
    "Halten Sie sie von Magneten und Elektrogeräten fern (Lautsprecher, Sicherheitsschleusen…).",
    "Tenetelo lontano da magneti e apparecchi elettrici (altoparlanti, metal detector…).",
    "Manténgalo alejado de imanes y aparatos eléctricos (altavoces, arcos de seguridad…).",
  ),
  "Évitez les températures extrêmes et les chocs thermiques (soleil puis eau froide).": t(
    "Avoid extreme temperatures and thermal shocks (sun followed by cold water).",
    "Vermeiden Sie extreme Temperaturen und Temperaturschocks (Sonne, dann kaltes Wasser).",
    "Evitate temperature estreme e shock termici (sole e poi acqua fredda).",
    "Evite temperaturas extremas y choques térmicos (sol y luego agua fría).",
  ),
  "Évitez parfums, solvants et cosmétiques : ils abîment joints et bracelets.": t(
    "Avoid perfume, solvents and cosmetics: they damage seals and straps.",
    "Vermeiden Sie Parfum, Lösungsmittel und Kosmetika: Sie schädigen Dichtungen und Armbänder.",
    "Evitate profumi, solventi e cosmetici: danneggiano guarnizioni e cinturini.",
    "Evite perfumes, disolventes y cosméticos: dañan juntas y correas.",
  ),
  "Faites changer la pile par un centre agréé ou un revendeur officiel.": t(
    "Have the battery replaced by an authorised service centre or official retailer.",
    "Lassen Sie die Batterie von einem autorisierten Service-Center oder Fachhändler wechseln.",
    "Fate sostituire la batteria da un centro autorizzato o da un rivenditore ufficiale.",
    "Haga cambiar la pila en un centro autorizado o un distribuidor oficial.",
  ),
  "Nettoyez boîtier étanche et bracelet métal à l'eau savonneuse, puis séchez.": t(
    "Clean a water-resistant case and metal bracelet with soapy water, then dry.",
    "Reinigen Sie wasserdichtes Gehäuse und Metallband mit Seifenwasser und trocknen Sie sie ab.",
    "Pulite cassa impermeabile e bracciale in metallo con acqua saponata, poi asciugate.",
    "Limpie la caja estanca y el brazalete metálico con agua jabonosa y séquelos.",
  ),
  "Pour une pièce vintage, évitez l'eau ; faites évaluer son état par un centre agréé.": t(
    "For a vintage piece, avoid water; have its condition assessed by an authorised centre.",
    "Meiden Sie bei einem Vintage-Stück Wasser; lassen Sie den Zustand von einem autorisierten Service-Center prüfen.",
    "Per un pezzo vintage evitate l'acqua; fatene valutare lo stato da un centro autorizzato.",
    "En una pieza vintage, evite el agua; haga evaluar su estado en un centro autorizado.",
  ),

  // Garanties (brand-info.ts).
  "Lightmaster Solar et chronomètres certifiés COSC": t(
    "Lightmaster Solar and COSC-certified chronometers",
    "Lightmaster Solar und COSC-zertifizierte Chronometer",
    "Lightmaster Solar e cronometri certificati COSC",
    "Lightmaster Solar y cronómetros certificados COSC",
  ),
  "montres automatiques": t(
    "automatic watches",
    "Automatikuhren",
    "orologi automatici",
    "relojes automáticos",
  ),
  "durée de vie de la pile": t(
    "battery life",
    "Lebensdauer der Batterie",
    "durata della batteria",
    "duración de la pila",
  ),
  "usure normale": t("normal wear", "normaler Verschleiß", "normale usura", "desgaste normal"),
  "usure normale (rayures, bracelets cuir ou caoutchouc, PVD)": t(
    "normal wear (scratches, leather or rubber straps, PVD)",
    "normaler Verschleiß (Kratzer, Leder- oder Kautschukbänder, PVD)",
    "normale usura (graffi, cinturini in pelle o caucciù, PVD)",
    "desgaste normal (arañazos, correas de piel o caucho, PVD)",
  ),
  accidents: t("accidents", "Unfälle", "incidenti", "accidentes"),
  "accidents et mauvaise utilisation": t(
    "accidents and misuse",
    "Unfälle und unsachgemäßer Gebrauch",
    "incidenti e uso improprio",
    "accidentes y mal uso",
  ),
  "intervention par une personne non agréée": t(
    "work by an unauthorised person",
    "Eingriffe durch nicht autorisierte Personen",
    "interventi di persone non autorizzate",
    "intervención de una persona no autorizada",
  ),
  "intervention par une personne non agréée, y compris le changement de pile": t(
    "work by an unauthorised person, including battery replacement",
    "Eingriffe durch nicht autorisierte Personen, einschließlich Batteriewechsel",
    "interventi di persone non autorizzate, compresa la sostituzione della batteria",
    "intervención de una persona no autorizada, incluido el cambio de pila",
  ),

  // Révision (brand-info.ts).
  "Changement de pile inclus dans le service partiel pour les modèles à quartz à pile.": t(
    "Battery replacement included in the partial service for battery-powered quartz models.",
    "Batteriewechsel bei batteriebetriebenen Quarzmodellen in der Teilrevision enthalten.",
    "Sostituzione della batteria inclusa nel servizio parziale per i modelli al quarzo a batteria.",
    "Cambio de pila incluido en el servicio parcial para los modelos de cuarzo con pila.",
  ),
  "Forfait étanchéité et pile proposé uniquement dans les boutiques Longines de Sèvres et Saint-Honoré.":
    t(
      "Water-resistance and battery package offered only in the Longines boutiques on rue de Sèvres and rue Saint-Honoré (Paris).",
      "Paket Dichtigkeit und Batterie nur in den Longines-Boutiquen Sèvres und Saint-Honoré (Paris) angeboten.",
      "Pacchetto impermeabilità e batteria offerto solo nelle boutique Longines di Sèvres e Saint-Honoré (Parigi).",
      "Paquete de estanqueidad y pila ofrecido solo en las boutiques Longines de Sèvres y Saint-Honoré (París).",
    ),
  "Tarifs indicatifs hors frais logistiques ; diagnostic préalable. Service partiel garanti sur l'étanchéité, service complet également sur le mouvement.":
    t(
      "Indicative prices excluding logistics costs; prior diagnosis. Partial service guaranteed for water resistance, full service also for the movement.",
      "Richtpreise ohne Logistikkosten; vorherige Diagnose. Teilrevision mit Garantie auf die Dichtigkeit, komplette Revision auch auf das Uhrwerk.",
      "Tariffe indicative escluse spese logistiche; diagnosi preliminare. Servizio parziale garantito sull'impermeabilità, servizio completo anche sul movimento.",
      "Tarifas orientativas sin gastos logísticos; diagnóstico previo. Servicio parcial garantizado en la estanqueidad, servicio completo también en el movimiento.",
    ),
  "Prix TTC hors frais de port ; fournitures hors forfait facturées séparément. Montres antérieures à 1990 : sur devis.":
    t(
      "Prices including VAT, excluding shipping; parts outside the package charged separately. Watches made before 1990: on quotation.",
      "Preise inkl. MwSt., ohne Versand; Teile außerhalb des Pakets werden separat berechnet. Uhren vor 1990: auf Kostenvoranschlag.",
      "Prezzi IVA inclusa, spedizione esclusa; forniture fuori pacchetto fatturate a parte. Orologi anteriori al 1990: su preventivo.",
      "Precios con IVA, sin gastos de envío; piezas fuera del paquete facturadas aparte. Relojes anteriores a 1990: bajo presupuesto.",
    ),
  "Pièce vintage : demander un devis au centre agréé ; les forfaits courants ne sont pas appliqués.":
    t(
      "Vintage piece: ask the authorised centre for a quotation; standard packages do not apply.",
      "Vintage-Stück: Kostenvoranschlag beim autorisierten Service-Center anfragen; Standardpakete gelten nicht.",
      "Pezzo vintage: chiedete un preventivo al centro autorizzato; i pacchetti standard non si applicano.",
      "Pieza vintage: pida presupuesto al centro autorizado; no se aplican los paquetes habituales.",
    ),
  "tous les 4 à 5 ans selon la FAQ ; contrôle tous les 3 à 4 ans sur la page garantie. Suivre le manuel du modèle et l'avis du centre agréé":
    t(
      "every 4 to 5 years according to the FAQ; a check every 3 to 4 years on the warranty page. Follow the model's manual and the authorised centre's advice",
      "alle 4 bis 5 Jahre laut FAQ; Kontrolle alle 3 bis 4 Jahre laut Garantieseite. Anleitung des Modells und Rat des Service-Centers befolgen",
      "ogni 4-5 anni secondo le FAQ; controllo ogni 3-4 anni secondo la pagina della garanzia. Seguire il manuale del modello e il parere del centro autorizzato",
      "cada 4 a 5 años según las preguntas frecuentes; revisión cada 3 a 4 años según la página de garantía. Seguir el manual del modelo y el consejo del centro autorizado",
    ),
  "une fois par an": t("once a year", "einmal im Jahr", "una volta all'anno", "una vez al año"),
  "pas de fréquence fixe : selon le modèle, l'environnement et l'usage": t(
    "no fixed interval: depends on the model, environment and use",
    "kein festes Intervall: je nach Modell, Umgebung und Nutzung",
    "nessuna frequenza fissa: secondo il modello, l'ambiente e l'uso",
    "sin frecuencia fija: según el modelo, el entorno y el uso",
  ),
  "tous les 1 à 2 ans (restauration de l'étanchéité)": t(
    "every 1 to 2 years (restoring water resistance)",
    "alle 1 bis 2 Jahre (Wiederherstellung der Dichtigkeit)",
    "ogni 1-2 anni (ripristino dell'impermeabilità)",
    "cada 1 a 2 años (restauración de la estanqueidad)",
  ),
  "2 à 5 ans selon le mouvement": t(
    "2 to 5 years depending on the movement",
    "2 bis 5 Jahre je nach Uhrwerk",
    "da 2 a 5 anni secondo il movimento",
    "de 2 a 5 años según el movimiento",
  ),
  "dommages dus à une mauvaise utilisation, eau comprise": t(
    "damage caused by improper use, including water damage",
    "Schäden durch unsachgemäßen Gebrauch, einschließlich Wasserschäden",
    "danni dovuti a un uso improprio, compresi quelli causati dall'acqua",
    "daños por mal uso, incluidos los causados por el agua",
  ),
  "tous les 4 à 5 ans": t(
    "every 4 to 5 years",
    "alle 4 bis 5 Jahre",
    "ogni 4-5 anni",
    "cada 4 a 5 años",
  ),
  Seiko: t("Seiko", "Seiko", "Seiko", "Seiko"),
  Sellita: t("Sellita", "Sellita", "Sellita", "Sellita"),
  Miyota: t("Miyota", "Miyota", "Miyota", "Miyota"),
  Soprod: t("Soprod", "Soprod", "Soprod", "Soprod"),
  Venezianico: t("Venezianico", "Venezianico", "Venezianico", "Venezianico"),
  "tous les 6 à 8 ans": t(
    "every 6 to 8 years",
    "alle 6 bis 8 Jahre",
    "ogni 6-8 anni",
    "cada 6 a 8 años",
  ),
  "au moins 10 ans après l'arrêt de production ; jusqu'à 20 ans pour les montres en or, avec substitution possible":
    t(
      "at least 10 years after the end of production; up to 20 years for gold watches, with possible substitution",
      "mindestens 10 Jahre nach Produktionsende; bis zu 20 Jahre für Golduhren, mit möglichem Ersatz",
      "almeno 10 anni dopo la fine della produzione; fino a 20 anni per gli orologi in oro, con possibile sostituzione",
      "al menos 10 años después del fin de la producción; hasta 20 años para los relojes de oro, con posible sustitución",
    ),
  "au moins 10 ans après l'arrêt de production du modèle": t(
    "at least 10 years after the model is discontinued",
    "mindestens 10 Jahre nach Produktionsende des Modells",
    "almeno 10 anni dopo la fine della produzione del modello",
    "al menos 10 años después del fin de la producción del modelo",
  ),
  démagnétisation: t(
    "demagnetisation",
    "Entmagnetisierung",
    "smagnetizzazione",
    "desmagnetización",
  ),
  "contrôle de la marche": t(
    "rate check",
    "Gangkontrolle",
    "controllo della marcia",
    "control de la marcha",
  ),
  "Suisse (Swiss Made)": t(
    "Switzerland (Swiss Made)",
    "Schweiz (Swiss Made)",
    "Svizzera (Swiss Made)",
    "Suiza (Swiss Made)",
  ),
  "ETA, en collaboration avec Hamilton": t(
    "ETA, in collaboration with Hamilton",
    "ETA, in Zusammenarbeit mit Hamilton",
    "ETA, in collaborazione con Hamilton",
    "ETA, en colaboración con Hamilton",
  ),

  // Comparaisons (compare.ts).
  "Mouvement mécanique": t(
    "Mechanical movement",
    "Mechanisches Uhrwerk",
    "Movimento meccanico",
    "Movimiento mecánico",
  ),
  "Quartz solaire, sans changement de pile": t(
    "Solar quartz, no battery changes",
    "Solar-Quarz, ohne Batteriewechsel",
    "Quarzo solare, senza cambio batteria",
    "Cuarzo solar, sin cambio de pila",
  ),
  "Verre saphir": t("Sapphire crystal", "Saphirglas", "Vetro zaffiro", "Cristal de zafiro"),
  "Spiral en silicium": t(
    "Silicon hairspring",
    "Siliziumspirale",
    "Spirale in silicio",
    "Espiral de silicio",
  ),
  "Chronomètre certifié COSC": t(
    "COSC-certified chronometer",
    "COSC-zertifizierter Chronometer",
    "Cronometro certificato COSC",
    "Cronómetro certificado COSC",
  ),
  "Fond transparent": t(
    "Transparent case back",
    "Transparenter Gehäuseboden",
    "Fondello trasparente",
    "Fondo transparente",
  ),
  "Couronne vissée": t(
    "Screw-down crown",
    "Verschraubte Krone",
    "Corona a vite",
    "Corona enroscada",
  ),
  "Lunette en céramique": t(
    "Ceramic bezel",
    "Keramiklünette",
    "Lunetta in ceramica",
    "Bisel de cerámica",
  ),
  "Bracelet interchangeable sans outil": t(
    "Tool-free interchangeable strap",
    "Ohne Werkzeug wechselbares Armband",
    "Cinturino intercambiabile senza attrezzi",
    "Correa intercambiable sin herramientas",
  ),
};

/** Texte fixe dans la langue ; sans traduction, l'anglais, puis le français. */
export function localize(text: string, locale: Locale = "fr"): string {
  if (locale === "fr") return text;
  const entry = TEXTS[text];
  return entry?.[locale] ?? entry?.en ?? text;
}

/** Liste de textes fixes, traduits un à un (« durée de vie de la pile, usure normale »). */
export function localizeList(texts: string[], locale: Locale = "fr"): string {
  return texts.map((x) => localize(x, locale)).join(", ");
}

/** Phrases à variables de la fiche technique et des comparaisons. */
export interface Phrases {
  hours: (n: string) => string;
  vph: (n: string) => string;
  antiReflective: string;
  diamonds: (n: string) => string;
  carat: (n: string) => string;
  top: (v: string) => string;
  under: (v: string) => string;
  coating: (v: string) => string;
  strapLengths: (a: string, b: string) => string;
  years: (n: string) => string;
  yearsWhen: (n: string, when: string) => string;
  months: (n: string) => string;
  priceNote: (date: string) => string;
  free: (list: string) => string;
  batteryLife: (v: string) => string;
  stores: (n: string) => string;
  reserveInstead: (c: number, b: number) => string;
  waterInstead: (c: number, b: number) => string;
  warrantyYears: (n: number) => string;
}

export const PHRASES: Record<Locale, Phrases> = {
  fr: {
    hours: (n) => `${n} heures`,
    vph: (n) => `${n} alternances par heure`,
    antiReflective: ", antireflet",
    diamonds: (n) => `${n} diamants`,
    carat: (n) => `, ${n} carat`,
    top: (v) => `dessus : ${v}`,
    under: (v) => `dessous : ${v}`,
    coating: (v) => `revêtement ${v}`,
    strapLengths: (a, b) => `${a} mm (12 h) et ${b} mm (6 h)`,
    years: (n) => `${n} ans`,
    yearsWhen: (n, when) => `${n} ans : ${when}.`,
    months: (n) => `${n} mois`,
    priceNote: (date) => `Prix conseillé par la marque en France, relevé le ${date}.`,
    free: (list) => `Offerts : ${list}.`,
    batteryLife: (v) => `Durée de vie d'une pile : ${v}.`,
    stores: (n) => `${n} répertoriés`,
    reserveInstead: (c, b) => `${c} h de réserve de marche au lieu de ${b} h`,
    waterInstead: (c, b) => `Étanche à ${c} m au lieu de ${b} m`,
    warrantyYears: (n) => `Garantie de ${n} ans`,
  },
  en: {
    hours: (n) => `${n} hours`,
    vph: (n) => `${n} vibrations per hour`,
    antiReflective: ", anti-reflective",
    diamonds: (n) => `${n} diamonds`,
    carat: (n) => `, ${n} carat`,
    top: (v) => `top: ${v}`,
    under: (v) => `underside: ${v}`,
    coating: (v) => `coating ${v}`,
    strapLengths: (a, b) => `${a} mm (12 o'clock) and ${b} mm (6 o'clock)`,
    years: (n) => `${n} years`,
    yearsWhen: (n, when) => `${n} years: ${when}.`,
    months: (n) => `${n} months`,
    priceNote: (date) => `Brand's recommended price in France, checked on ${date}.`,
    free: (list) => `Included free: ${list}.`,
    batteryLife: (v) => `Battery life: ${v}.`,
    stores: (n) => `${n} listed`,
    reserveInstead: (c, b) => `${c} h power reserve instead of ${b} h`,
    waterInstead: (c, b) => `Water-resistant to ${c} m instead of ${b} m`,
    warrantyYears: (n) => `${n}-year warranty`,
  },
  de: {
    hours: (n) => `${n} Stunden`,
    vph: (n) => `${n} Halbschwingungen pro Stunde`,
    antiReflective: ", entspiegelt",
    diamonds: (n) => `${n} Diamanten`,
    carat: (n) => `, ${n} Karat`,
    top: (v) => `Oberseite: ${v}`,
    under: (v) => `Unterseite: ${v}`,
    coating: (v) => `Beschichtung ${v}`,
    strapLengths: (a, b) => `${a} mm (12 Uhr) und ${b} mm (6 Uhr)`,
    years: (n) => `${n} Jahre`,
    yearsWhen: (n, when) => `${n} Jahre: ${when}.`,
    months: (n) => `${n} Monate`,
    priceNote: (date) => `Von der Marke empfohlener Preis in Frankreich, erfasst am ${date}.`,
    free: (list) => `Inklusive: ${list}.`,
    batteryLife: (v) => `Lebensdauer einer Batterie: ${v}.`,
    stores: (n) => `${n} erfasst`,
    reserveInstead: (c, b) => `${c} h Gangreserve statt ${b} h`,
    waterInstead: (c, b) => `Wasserdicht bis ${c} m statt ${b} m`,
    warrantyYears: (n) => `${n} Jahre Garantie`,
  },
  it: {
    hours: (n) => `${n} ore`,
    vph: (n) => `${n} alternanze all'ora`,
    antiReflective: ", antiriflesso",
    diamonds: (n) => `${n} diamanti`,
    carat: (n) => `, ${n} carati`,
    top: (v) => `sopra: ${v}`,
    under: (v) => `sotto: ${v}`,
    coating: (v) => `rivestimento ${v}`,
    strapLengths: (a, b) => `${a} mm (ore 12) e ${b} mm (ore 6)`,
    years: (n) => `${n} anni`,
    yearsWhen: (n, when) => `${n} anni: ${when}.`,
    months: (n) => `${n} mesi`,
    priceNote: (date) => `Prezzo consigliato dal marchio in Francia, rilevato il ${date}.`,
    free: (list) => `Inclusi: ${list}.`,
    batteryLife: (v) => `Durata di una batteria: ${v}.`,
    stores: (n) => `${n} censiti`,
    reserveInstead: (c, b) => `${c} h di riserva di carica invece di ${b} h`,
    waterInstead: (c, b) => `Impermeabile fino a ${c} m invece di ${b} m`,
    warrantyYears: (n) => `Garanzia di ${n} anni`,
  },
  es: {
    hours: (n) => `${n} horas`,
    vph: (n) => `${n} alternancias por hora`,
    antiReflective: ", antirreflejos",
    diamonds: (n) => `${n} diamantes`,
    carat: (n) => `, ${n} quilates`,
    top: (v) => `exterior: ${v}`,
    under: (v) => `interior: ${v}`,
    coating: (v) => `revestimiento ${v}`,
    strapLengths: (a, b) => `${a} mm (12 h) y ${b} mm (6 h)`,
    years: (n) => `${n} años`,
    yearsWhen: (n, when) => `${n} años: ${when}.`,
    months: (n) => `${n} meses`,
    priceNote: (date) => `Precio recomendado por la marca en Francia, consultado el ${date}.`,
    free: (list) => `Incluidos: ${list}.`,
    batteryLife: (v) => `Duración de una pila: ${v}.`,
    stores: (n) => `${n} registrados`,
    reserveInstead: (c, b) => `${c} h de reserva de marcha en lugar de ${b} h`,
    waterInstead: (c, b) => `Estanco hasta ${c} m en lugar de ${b} m`,
    warrantyYears: (n) => `Garantía de ${n} años`,
  },
};

const LOCALE_TAGS: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  de: "de-DE",
  it: "it-IT",
  es: "es-ES",
};

/** Nombre au format de la langue (espace insécable en français). */
export function formatNumber(n: number, locale: Locale = "fr"): string {
  return n.toLocaleString(LOCALE_TAGS[locale], { maximumFractionDigits: 2 }).replace(/ /g, " ");
}

/** Date AAAA-MM-JJ au format de la langue. */
export function formatIsoDate(iso: string, locale: Locale = "fr"): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Avantage de comparaison (compare.ts) enregistré en français dans watch_scores.alternatives :
 * texte fixe, liste de complications ou phrase à nombres.
 */
export function localizeAdvantage(text: string, locale: Locale = "fr"): string {
  if (locale === "fr") return text;
  const p = PHRASES[locale];
  const reserve = /^(\d+) h de réserve de marche au lieu de (\d+) h$/.exec(text);
  if (reserve) return p.reserveInstead(Number(reserve[1]), Number(reserve[2]));
  const water = /^Étanche à (\d+) m au lieu de (\d+) m$/.exec(text);
  if (water) return p.waterInstead(Number(water[1]), Number(water[2]));
  const warranty = /^Garantie de (\d+(?:[.,]\d+)?) ans$/.exec(text);
  if (warranty) return p.warrantyYears(Number(warranty[1]!.replace(",", ".")));
  return text
    .split(", ")
    .map((part) => localize(part, locale))
    .join(", ");
}
