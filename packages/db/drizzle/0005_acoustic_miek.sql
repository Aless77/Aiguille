CREATE TABLE "calibers" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" "movement_type",
	"frequency_vph" integer,
	"power_reserve_h" integer,
	"watch_count" integer NOT NULL,
	"silicon_count" integer DEFAULT 0 NOT NULL,
	"antimagnetic_count" integer DEFAULT 0 NOT NULL,
	"chronometer_count" integer DEFAULT 0 NOT NULL,
	"complications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "design" smallint;--> statement-breakpoint
ALTER TABLE "watch_scores" ADD COLUMN "category_label" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_scores" ADD COLUMN "family" text DEFAULT 'quotidien' NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_scores" ADD COLUMN "price_band" text;--> statement-breakpoint
ALTER TABLE "watch_scores" ADD COLUMN "category_size" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_scores" ADD COLUMN "category_rank" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_scores" ADD COLUMN "community_score" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "watch_scores" ADD COLUMN "community_confidence" "score_confidence";--> statement-breakpoint
ALTER TABLE "calibers" ADD CONSTRAINT "calibers_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calibers_brand_name_idx" ON "calibers" USING btree ("brand_id","name");--> statement-breakpoint
CREATE INDEX "watch_scores_community_idx" ON "watch_scores" USING btree ("community_score");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_design_range" CHECK ("reviews"."design" is null or "reviews"."design" between 1 and 5);