ALTER TABLE "item_types" ADD COLUMN "name_cn_simplified" varchar(100);--> statement-breakpoint
ALTER TABLE "item_types" ADD COLUMN "name_cn_traditional" varchar(100);--> statement-breakpoint
ALTER TABLE "item_types" ADD COLUMN "description_cn" text;--> statement-breakpoint
ALTER TABLE "item_types" ADD COLUMN "embedding" vector(3072);--> statement-breakpoint
CREATE INDEX "embedding_idx" ON "item_types" USING hnsw ("embedding" vector_cosine_ops);