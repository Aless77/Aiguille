import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Segment de marché d'une marque (voir le cahier des charges, section Périmètre). */
export const brandSegment = pgEnum("brand_segment", ["coeur", "milieu_haut"]);

/** Marques suivies par Aiguille. Le slug sert dans les URL publiques : il ne doit jamais changer. */
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  segment: brandSegment("segment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

/** Ligne de produits d'une marque (Tissot PRX, Hamilton Khaki Field…). Slug immuable. */
export const collections = pgTable(
  "collections",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("collections_brand_slug_idx").on(t.brandId, t.slug)],
);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export const movementType = pgEnum("movement_type", [
  "automatique",
  "manuel",
  "quartz",
  "solaire",
  "autre",
]);

export const watchStatus = pgEnum("watch_status", ["active", "discontinued"]);

/**
 * Une référence de montre (ex. T137.407.11.041.00). Le slug est immuable une fois publié.
 * Les caractéristiques normalisées servent aux filtres ; `rawSpecs` garde tout le reste tel que
 * publié par la source (libellé → valeur).
 */
export const watches = pgTable(
  "watches",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id),
    collectionId: integer("collection_id").references(() => collections.id),
    /** Référence sans séparateurs, en majuscules : clé de rapprochement entre sources. */
    referenceKey: text("reference_key").notNull(),
    /** Référence telle qu'affichée (avec séparateurs quand on sait les reconstituer). */
    reference: text("reference").notNull(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),

    movement: movementType("movement"),
    caliber: text("caliber"),
    diameterMm: numeric("diameter_mm", { precision: 4, scale: 1, mode: "number" }),
    thicknessMm: numeric("thickness_mm", { precision: 4, scale: 1, mode: "number" }),
    lugWidthMm: numeric("lug_width_mm", { precision: 4, scale: 1, mode: "number" }),
    waterResistanceM: integer("water_resistance_m"),
    powerReserveH: integer("power_reserve_h"),
    caseMaterial: text("case_material"),
    crystal: text("crystal"),
    dialColor: text("dial_color"),
    strapMaterial: text("strap_material"),
    rawSpecs: jsonb("raw_specs").$type<Record<string, string>>().notNull().default({}),

    /** Images hébergées par la marque (liens directs, voir docs/decisions.md). */
    imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
    /** Prix catalogue officiel en centimes d'euro (dernier relevé). */
    catalogPriceCents: integer("catalog_price_cents"),
    officialUrl: text("official_url"),

    status: watchStatus("status").notNull().default("active"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("watches_brand_reference_idx").on(t.brandId, t.referenceKey),
    index("watches_collection_idx").on(t.collectionId),
    index("watches_price_idx").on(t.catalogPriceCents),
  ],
);

export type Watch = typeof watches.$inferSelect;
export type NewWatch = typeof watches.$inferInsert;

export const availability = pgEnum("availability", [
  "in_stock",
  "out_of_stock",
  "preorder",
  "unknown",
]);

/**
 * Historique des prix et du stock, par source. Règle du cahier des charges : une ligne n'est
 * ajoutée que si le prix ou la disponibilité change par rapport au dernier relevé de la source.
 */
export const priceObservations = pgTable(
  "price_observations",
  {
    id: serial("id").primaryKey(),
    watchId: integer("watch_id")
      .notNull()
      .references(() => watches.id, { onDelete: "cascade" }),
    /** Identifiant de la source (ex. « tissot-officiel »). */
    source: text("source").notNull(),
    /**
     * Pays du prix (code ISO 3166-1 alpha-2) : la même source publie un prix par pays (lot 4).
     * Les prix sont stockés dans la devise locale, convertis à l'affichage (exchange_rates).
     */
    country: text("country").notNull().default("FR"),
    /** Prix en centimes de la devise `currency`. */
    priceCents: integer("price_cents"),
    currency: text("currency").notNull().default("EUR"),
    availability: availability("availability").notNull().default("unknown"),
    url: text("url"),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("price_observations_watch_source_idx").on(t.watchId, t.source, t.country, t.observedAt),
  ],
);

export type PriceObservation = typeof priceObservations.$inferSelect;
export type NewPriceObservation = typeof priceObservations.$inferInsert;

/**
 * Taux de change de la BCE (via Frankfurter), un par jour et par devise : nombre d'unités de la
 * devise pour 1 euro. Sert à convertir les prix nationaux en euros.
 */
export const exchangeRates = pgTable(
  "exchange_rates",
  {
    date: text("date").notNull(),
    currency: text("currency").notNull(),
    unitsPerEur: numeric("units_per_eur", { precision: 14, scale: 6, mode: "number" }).notNull(),
  },
  (t) => [uniqueIndex("exchange_rates_date_currency_idx").on(t.date, t.currency)],
);

export type ExchangeRate = typeof exchangeRates.$inferSelect;

export const storeStatus = pgEnum("store_status", ["pending", "active", "ignored", "closed"]);

/**
 * Points de vente agréés publiés par les marques (lot 4). Le stock par boutique n'est publié par
 * aucune source : la carte présente des boutiques agréées, pas une disponibilité.
 * `pending` : URL découverte, pas encore visitée ; `ignored` : hors des pays couverts.
 */
export const stores = pgTable(
  "stores",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id),
    source: text("source").notNull(),
    url: text("url").notNull(),
    status: storeStatus("status").notNull().default("pending"),
    name: text("name"),
    street: text("street"),
    postalCode: text("postal_code"),
    city: text("city"),
    country: text("country"),
    latitude: numeric("latitude", { precision: 9, scale: 6, mode: "number" }),
    longitude: numeric("longitude", { precision: 9, scale: 6, mode: "number" }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    /** Dernière visite de la page (rafraîchissement par lots, les plus anciennes d'abord). */
    visitedAt: timestamp("visited_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("stores_source_url_idx").on(t.source, t.url),
    index("stores_brand_country_idx").on(t.brandId, t.country, t.status),
  ],
);

export type Store = typeof stores.$inferSelect;

export const scrapeRunStatus = pgEnum("scrape_run_status", ["running", "success", "failed"]);

/** Journal des exécutions du scraper : sert à détecter une source cassée (zéro résultat). */
export const scrapeRuns = pgTable(
  "scrape_runs",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    status: scrapeRunStatus("status").notNull().default("running"),
    pagesFetched: integer("pages_fetched").notNull().default(0),
    watchesFound: integer("watches_found").notNull().default(0),
    watchesCreated: integer("watches_created").notNull().default(0),
    priceChanges: integer("price_changes").notNull().default(0),
    errors: integer("errors").notNull().default(0),
    message: text("message"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("scrape_runs_source_idx").on(t.source, t.startedAt)],
);

export type ScrapeRun = typeof scrapeRuns.$inferSelect;
