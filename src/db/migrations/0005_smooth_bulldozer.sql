CREATE TABLE "reconciliation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"cabinet_id" integer NOT NULL,
	"total_scanned" integer NOT NULL,
	"missing_count" integer DEFAULT 0 NOT NULL,
	"recovered_count" integer DEFAULT 0 NOT NULL,
	"scanned_tags" jsonb,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reconciliation_logs" ADD CONSTRAINT "reconciliation_logs_cabinet_id_locations_id_fk" FOREIGN KEY ("cabinet_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;