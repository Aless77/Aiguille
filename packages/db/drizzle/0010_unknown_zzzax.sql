CREATE TABLE "watch_translations" (
	"watch_id" integer NOT NULL,
	"locale" text NOT NULL,
	"data" jsonb NOT NULL,
	"source_url" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_translations_watch_id_locale_pk" PRIMARY KEY("watch_id","locale")
);
--> statement-breakpoint
ALTER TABLE "watch_translations" ADD CONSTRAINT "watch_translations_watch_id_watches_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."watches"("id") ON DELETE cascade ON UPDATE no action;