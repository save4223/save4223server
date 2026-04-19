CREATE TYPE "public"."borrow_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."issue_report_status" AS ENUM('PENDING', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."issue_report_type" AS ENUM('DIDNT_BORROW', 'ALREADY_RETURNED', 'TAG_DAMAGED', 'TOOL_BROKEN', 'OTHER');--> statement-breakpoint
CREATE TABLE "borrow_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"item_type_id" integer NOT NULL,
	"reason" text NOT NULL,
	"requested_start" timestamp with time zone NOT NULL,
	"requested_end" timestamp with time zone NOT NULL,
	"status" "borrow_request_status" DEFAULT 'PENDING' NOT NULL,
	"admin_review_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"report_type" "issue_report_type" NOT NULL,
	"description" text,
	"status" "issue_report_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid
);
--> statement-breakpoint
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_item_type_id_item_types_id_fk" FOREIGN KEY ("item_type_id") REFERENCES "public"."item_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_resolved_by_profiles_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;