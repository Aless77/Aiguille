CREATE TYPE "public"."review_ownership" AS ENUM('owner', 'tried');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('published', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."score_confidence" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"watch_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"finishing" smallint NOT NULL,
	"comfort" smallint NOT NULL,
	"legibility" smallint NOT NULL,
	"accuracy" smallint NOT NULL,
	"value" smallint NOT NULL,
	"ownership" "review_ownership" NOT NULL,
	"comment" text,
	"status" "review_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_finishing_range" CHECK ("reviews"."finishing" between 1 and 5),
	CONSTRAINT "reviews_comfort_range" CHECK ("reviews"."comfort" between 1 and 5),
	CONSTRAINT "reviews_legibility_range" CHECK ("reviews"."legibility" between 1 and 5),
	CONSTRAINT "reviews_accuracy_range" CHECK ("reviews"."accuracy" between 1 and 5),
	CONSTRAINT "reviews_value_range" CHECK ("reviews"."value" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "watch_scores" (
	"watch_id" integer PRIMARY KEY NOT NULL,
	"score" smallint NOT NULL,
	"confidence" "score_confidence" NOT NULL,
	"pillars" jsonb NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"review_average" numeric(3, 2),
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_watch_id_watches_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."watches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_scores" ADD CONSTRAINT "watch_scores_watch_id_watches_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."watches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_watch_user_idx" ON "reviews" USING btree ("watch_id","user_id");--> statement-breakpoint
CREATE INDEX "reviews_watch_status_idx" ON "reviews" USING btree ("watch_id","status");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "watch_scores_score_idx" ON "watch_scores" USING btree ("score");