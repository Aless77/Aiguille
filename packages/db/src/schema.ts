import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { type Alternative } from "./compare.ts";
import { type Pillars } from "./rating.ts";
import { type WatchTranslationData } from "./translations.ts";

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

// ── Comptes (lot 5) ─────────────────────────────────────────────────────────────────────────
// Tables attendues par Better Auth (apps/web/src/lib/auth/server.ts, option usePlural). Les noms
// des propriétés sont ceux de Better Auth ; ne pas les renommer sans configurer `fields`.
// Connexion Google et GitHub uniquement : aucun mot de passe n'est stocké.

/** Utilisateur. Le nom et l'avatar viennent du fournisseur de connexion. */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /**
   * Pays de provenance déclaré (voir countries.ts) (code ISO 3166-1 alpha-2), jamais d'adresse : statistiques de
   * fréquentation par pays. `null` : pas encore demandé ; `ZZ` : préfère ne pas le dire.
   */
  country: text("country"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;

/** L'authentification seule ne donne aucun accès au site : validation manuelle obligatoire. */
export const accessRequests = pgTable("access_requests", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  motivation: text("motivation").notNull(),
  origin: text("origin").notNull(),
  interestedBrands: text("interested_brands").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

/** Compteurs partagés entre les instances pour limiter les tentatives administrateur. */
export const adminLoginAttempts = pgTable("admin_login_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** Session ouverte (cookie). Supprimée à la déconnexion ou à expiration. */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Compte chez un fournisseur (Google, GitHub) rattaché à un utilisateur. */
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

/** Jetons temporaires de Better Auth (état OAuth…). */
export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

// ── Avis et note (lot 5) ────────────────────────────────────────────────────────────────────

/** Le déposant possède la montre ou l'a seulement essayée (en boutique, chez un proche…). */
export const reviewOwnership = pgEnum("review_ownership", ["owner", "tried"]);
/** Un avis masqué (modération) ne compte plus dans la note ni n'est affiché. */
export const reviewStatus = pgEnum("review_status", ["published", "hidden"]);

const rating = (name: string) => smallint(name).notNull();

/**
 * Avis déposé sur le site : un seul par compte et par montre (modifiable). Supprimé avec le
 * compte. Critères notés de 1 à 5 (REVIEW_CRITERIA dans rating.ts).
 */
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    watchId: integer("watch_id")
      .notNull()
      .references(() => watches.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    finishing: rating("finishing"),
    /** Ajouté après les premiers avis : null sur un avis plus ancien. */
    design: smallint("design"),
    comfort: rating("comfort"),
    legibility: rating("legibility"),
    accuracy: rating("accuracy"),
    value: rating("value"),
    ownership: reviewOwnership("ownership").notNull(),
    comment: text("comment"),
    status: reviewStatus("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("reviews_watch_user_idx").on(t.watchId, t.userId),
    index("reviews_watch_status_idx").on(t.watchId, t.status),
    index("reviews_user_idx").on(t.userId, t.createdAt),
    ...(["finishing", "comfort", "legibility", "accuracy", "value"] as const).map((c) =>
      check(`reviews_${c}_range`, sql`${t[c]} between 1 and 5`),
    ),
    check("reviews_design_range", sql`${t.design} is null or ${t.design} between 1 and 5`),
  ],
);

export type Review = typeof reviews.$inferSelect;

export const scoreConfidence = pgEnum("score_confidence", ["low", "medium", "high"]);

/**
 * Fiche d'une montre dans une autre langue, telle que publiée par la marque (translations.ts).
 * Une ligne par langue, mise à jour à chaque relevé ; « fr » relie les libellés à leurs clés.
 */
export const watchTranslations = pgTable(
  "watch_translations",
  {
    watchId: integer("watch_id")
      .notNull()
      .references(() => watches.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    data: jsonb("data").$type<WatchTranslationData>().notNull(),
    sourceUrl: text("source_url").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.watchId, t.locale] })],
);

/**
 * Note sur 100 de chaque montre, recalculée par scores.ts après chaque collecte et chaque avis.
 * Stockée (et non calculée à l'affichage) pour trier le catalogue par note.
 */
export const watchScores = pgTable(
  "watch_scores",
  {
    watchId: integer("watch_id")
      .primaryKey()
      .references(() => watches.id, { onDelete: "cascade" }),
    /** Note Aiguille sur 100, calculée dans la catégorie de la montre (rating.ts). */
    score: smallint("score").notNull(),
    /** Confiance de la Note Aiguille : données publiées par la marque, taille de la catégorie. */
    confidence: scoreConfidence("confidence").notNull(),
    pillars: jsonb("pillars").$type<Pillars>().notNull(),
    /** Catégorie de comparaison : « Milieu de gamme · plongée (1 000 à 2 000 €) ». */
    categoryLabel: text("category_label").notNull().default(""),
    family: text("family").notNull().default("quotidien"),
    priceBand: text("price_band"),
    categorySize: integer("category_size").notNull().default(0),
    /** Rang de la montre dans sa catégorie (1 = meilleure Note Aiguille). */
    categoryRank: integer("category_rank").notNull().default(0),
    // Avis de la communauté, séparé de la Note Aiguille.
    reviewCount: integer("review_count").notNull().default(0),
    /** Moyenne brute des avis sur 5 (null sans avis), affichée et pour AggregateRating. */
    reviewAverage: numeric("review_average", { precision: 3, scale: 2, mode: "number" }),
    /** Moyenne bayésienne sur 5 : tri « mieux notées par la communauté ». */
    communityScore: numeric("community_score", { precision: 3, scale: 2, mode: "number" }),
    communityConfidence: scoreConfidence("community_confidence"),
    /** Comparaison technique : montres au moins aussi bien équipées et moins chères. */
    alternatives: jsonb("alternatives").$type<Alternative[]>().notNull().default([]),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("watch_scores_score_idx").on(t.score),
    index("watch_scores_community_idx").on(t.communityScore),
  ],
);

/**
 * Base des calibres : faits publiés par les marques sur leurs fiches officielles, regroupés par
 * calibre (scores.ts, à chaque recalcul). Une même référence de calibre peut exister en plusieurs
 * versions (avec ou sans spiral silicium…) : on compte les fiches qui annoncent chaque atout.
 */
export const calibers = pgTable(
  "calibers",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id),
    name: text("name").notNull(),
    type: movementType("type"),
    /** Valeur la plus fréquente sur les fiches (null si jamais publiée). */
    frequencyVph: integer("frequency_vph"),
    powerReserveH: integer("power_reserve_h"),
    watchCount: integer("watch_count").notNull(),
    siliconCount: integer("silicon_count").notNull().default(0),
    antimagneticCount: integer("antimagnetic_count").notNull().default(0),
    chronometerCount: integer("chronometer_count").notNull().default(0),
    complications: jsonb("complications").$type<string[]>().notNull().default([]),
    /** Fiche officielle d'exemple : la source des faits. */
    sourceUrl: text("source_url"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("calibers_brand_name_idx").on(t.brandId, t.name)],
);

export type Caliber = typeof calibers.$inferSelect;

export type WatchScoreRow = typeof watchScores.$inferSelect;

// ── Listes de souhaits et communauté ───────────────────────────────────────────────────────

/**
 * Visibilité d'une liste : privée (son auteur seulement), partagée par son lien (toute personne
 * qui a l'URL, sans compte) ou publiée dans la communauté (/communaute, ouverte aux avis).
 */
export const wishlistVisibility = pgEnum("wishlist_visibility", ["private", "link", "community"]);

/**
 * Liste de souhaits d'un compte. `shareId` aléatoire et non devinable : c'est lui qui figure dans
 * l'URL publique (/listes/{shareId}), jamais l'identifiant numérique. Supprimée avec le compte.
 */
export const wishlists = pgTable(
  "wishlists",
  {
    id: serial("id").primaryKey(),
    shareId: text("share_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    visibility: wishlistVisibility("visibility").notNull().default("private"),
    /** Publiée sans nom ni photo : l'auteur apparaît comme « Auteur de la liste ». */
    anonymous: boolean("anonymous").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Dernière activité (modification, montre ajoutée, avis) : tri du forum. */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("wishlists_user_idx").on(t.userId),
    index("wishlists_visibility_updated_idx").on(t.visibility, t.updatedAt),
  ],
);

export type Wishlist = typeof wishlists.$inferSelect;

/** Marques épinglées par un compte : accès direct dans l'en-tête. Supprimées avec le compte. */
export const brandFavorites = pgTable(
  "brand_favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.brandId] }),
    index("brand_favorites_brand_idx").on(t.brandId),
  ],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    wishlistId: integer("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    watchId: integer("watch_id")
      .notNull()
      .references(() => watches.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.wishlistId, t.watchId] }),
    index("wishlist_items_watch_idx").on(t.watchId),
  ],
);

/**
 * Avis laissé sur une liste partagée, sur la liste entière ou sur l'une de ses montres. Masqué
 * (et non supprimé) quand l'auteur de la liste le retire ; supprimé avec le compte de son auteur.
 */
export const wishlistComments = pgTable(
  "wishlist_comments",
  {
    id: serial("id").primaryKey(),
    wishlistId: integer("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    watchId: integer("watch_id").references(() => watches.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    /** Affiché sous un pseudonyme propre à la liste (le compte reste connu du site seul). */
    anonymous: boolean("anonymous").notNull().default(false),
    /** Réponse à un avis (un seul niveau) ; supprimée avec lui. */
    parentId: integer("parent_id").references((): AnyPgColumn => wishlistComments.id, {
      onDelete: "cascade",
    }),
    status: reviewStatus("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("wishlist_comments_list_idx").on(t.wishlistId, t.createdAt),
    index("wishlist_comments_user_idx").on(t.userId, t.createdAt),
    index("wishlist_comments_parent_idx").on(t.parentId),
  ],
);

export type WishlistComment = typeof wishlistComments.$inferSelect;
