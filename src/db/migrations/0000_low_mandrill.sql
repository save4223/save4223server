CREATE TYPE "public"."item_category" AS ENUM('TOOL', 'CONSUMABLE', 'DEVICE');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('AVAILABLE', 'BORROWED', 'MISSING', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('CABINET', 'DRAWER', 'BIN');--> statement-breakpoint
CREATE TYPE "public"."permission_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('ACTIVE', 'COMPLETED', 'TIMEOUT', 'FORCE_CLOSED');--> statement-breakpoint
CREATE TYPE "public"."transaction_action" AS ENUM('BORROW', 'RETURN', 'MISSING_UNEXPECTED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'USER');--> statement-breakpoint
CREATE TABLE "access_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"location_id" integer NOT NULL,
	"status" "permission_status" DEFAULT 'PENDING' NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"request_reason" text,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cabinet_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cabinet_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"start_time" timestamp with time zone DEFAULT now() NOT NULL,
	"end_time" timestamp with time zone,
	"status" "session_status" DEFAULT 'ACTIVE' NOT NULL,
	"snapshot_start_rfids" jsonb,
	"snapshot_end_rfids" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action_type" "transaction_action" NOT NULL,
	"evidence_image_path" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" "item_category",
	"description" text,
	"image_url" text,
	"max_borrow_duration" interval DEFAULT '7 days',
	"total_quantity" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_type_id" integer NOT NULL,
	"rfid_tag" varchar(100) NOT NULL,
	"status" "item_status" DEFAULT 'AVAILABLE' NOT NULL,
	"home_location_id" integer,
	"current_holder_id" uuid,
	"due_at" timestamp with time zone,
	"last_overdue_notice_sent_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_rfid_tag_unique" UNIQUE("rfid_tag")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "location_type" NOT NULL,
	"parent_id" integer,
	"is_restricted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"card_uid" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_cards_card_uid_unique" UNIQUE("card_uid")
);
--> statement-breakpoint
ALTER TABLE "access_permissions" ADD CONSTRAINT "access_permissions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cabinet_sessions" ADD CONSTRAINT "cabinet_sessions_cabinet_id_locations_id_fk" FOREIGN KEY ("cabinet_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_session_id_cabinet_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cabinet_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_item_type_id_item_types_id_fk" FOREIGN KEY ("item_type_id") REFERENCES "public"."item_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_home_location_id_locations_id_fk" FOREIGN KEY ("home_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;