ALTER TABLE "inventory_transactions" DROP CONSTRAINT "inventory_transactions_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "issue_reports" DROP CONSTRAINT "issue_reports_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;