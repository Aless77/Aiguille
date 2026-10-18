import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
