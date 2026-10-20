CREATE TYPE "public"."store_status" AS ENUM('pending', 'active', 'ignored', 'closed');--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"date" text NOT NULL,
	"currency" text NOT NULL,
	"units_per_eur" numeric(14, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"source" text NOT NULL,
	"url" text NOT NULL,
	"status" "store_status" DEFAULT 'pending' NOT NULL,
	"name" text,
	"street" text,
	"postal_code" text,
	"city" text,
	"country" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visited_at" timestamp with time zone
);
--> statement-breakpoint
DROP INDEX "price_observations_watch_source_idx";--> statement-breakpoint
ALTER TABLE "price_observations" ADD COLUMN "country" text DEFAULT 'FR' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rates_date_currency_idx" ON "exchange_rates" USING btree ("date","currency");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_source_url_idx" ON "stores" USING btree ("source","url");--> statement-breakpoint
CREATE INDEX "stores_brand_country_idx" ON "stores" USING btree ("brand_id","country","status");--> statement-breakpoint
CREATE INDEX "price_observations_watch_source_idx" ON "price_observations" USING btree ("watch_id","source","country","observed_at");