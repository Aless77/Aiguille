CREATE TABLE "brand_favorites" (
	"user_id" text NOT NULL,
	"brand_id" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brand_favorites_user_id_brand_id_pk" PRIMARY KEY("user_id","brand_id")
);
--> statement-breakpoint
ALTER TABLE "brand_favorites" ADD CONSTRAINT "brand_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_favorites" ADD CONSTRAINT "brand_favorites_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_favorites_brand_idx" ON "brand_favorites" USING btree ("brand_id");