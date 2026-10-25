ALTER TABLE "wishlist_comments" ADD COLUMN "anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_comments" ADD COLUMN "parent_id" integer;--> statement-breakpoint
ALTER TABLE "wishlists" ADD COLUMN "anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_comments" ADD CONSTRAINT "wishlist_comments_parent_id_wishlist_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."wishlist_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wishlist_comments_parent_idx" ON "wishlist_comments" USING btree ("parent_id");