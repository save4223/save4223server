CREATE TABLE "item_type_fastener_specs" (
	"item_type_id" integer PRIMARY KEY NOT NULL,
	"material" varchar(50),
	"diameter" varchar(20),
	"length" real,
	"head_shape" varchar(50),
	"drive_type" varchar(50)
);
--> statement-breakpoint
ALTER TABLE "item_types" ADD COLUMN "current_stock" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "item_types" ADD COLUMN "min_threshold" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "item_type_fastener_specs" ADD CONSTRAINT "item_type_fastener_specs_item_type_id_item_types_id_fk" FOREIGN KEY ("item_type_id") REFERENCES "public"."item_types"("id") ON DELETE cascade ON UPDATE no action;