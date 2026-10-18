CREATE TYPE "public"."availability" AS ENUM('in_stock', 'out_of_stock', 'preorder', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('automatique', 'manuel', 'quartz', 'solaire', 'autre');--> statement-breakpoint
CREATE TYPE "public"."scrape_run_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."watch_status" AS ENUM('active', 'discontinued');--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"watch_id" integer NOT NULL,
	"source" text NOT NULL,
	"price_cents" integer,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"availability" "availability" DEFAULT 'unknown' NOT NULL,
	"url" text,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"status" "scrape_run_status" DEFAULT 'running' NOT NULL,
	"pages_fetched" integer DEFAULT 0 NOT NULL,
	"watches_found" integer DEFAULT 0 NOT NULL,
	"watches_created" integer DEFAULT 0 NOT NULL,
	"price_changes" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "watches" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"collection_id" integer,
	"reference_key" text NOT NULL,
	"reference" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"movement" "movement_type",
	"caliber" text,
	"diameter_mm" numeric(4, 1),
	"thickness_mm" numeric(4, 1),
	"lug_width_mm" numeric(4, 1),
	"water_resistance_m" integer,
	"power_reserve_h" integer,
	"case_material" text,
	"crystal" text,
	"dial_color" text,
	"strap_material" text,
	"raw_specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"catalog_price_cents" integer,
	"official_url" text,
	"status" "watch_status" DEFAULT 'active' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_watch_id_watches_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."watches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watches" ADD CONSTRAINT "watches_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watches" ADD CONSTRAINT "watches_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_brand_slug_idx" ON "collections" USING btree ("brand_id","slug");--> statement-breakpoint
CREATE INDEX "price_observations_watch_source_idx" ON "price_observations" USING btree ("watch_id","source","observed_at");--> statement-breakpoint
CREATE INDEX "scrape_runs_source_idx" ON "scrape_runs" USING btree ("source","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "watches_brand_reference_idx" ON "watches" USING btree ("brand_id","reference_key");--> statement-breakpoint
CREATE INDEX "watches_collection_idx" ON "watches" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "watches_price_idx" ON "watches" USING btree ("catalog_price_cents");