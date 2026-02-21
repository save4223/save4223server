import { pgTable, serial, varchar, text, timestamp, boolean, uuid, integer, jsonb, interval, pgEnum } from 'drizzle-orm/pg-core'

// Enums
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'MANAGER', 'USER'])
export const locationTypeEnum = pgEnum('location_type', ['CABINET', 'DRAWER', 'BIN'])
export const permissionStatusEnum = pgEnum('permission_status', ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'])
export const itemStatusEnum = pgEnum('item_status', ['AVAILABLE', 'BORROWED', 'MISSING', 'MAINTENANCE'])
export const itemCategoryEnum = pgEnum('item_category', ['TOOL', 'CONSUMABLE', 'DEVICE'])
export const sessionStatusEnum = pgEnum('session_status', ['ACTIVE', 'COMPLETED', 'TIMEOUT', 'FORCE_CLOSED'])
export const transactionActionEnum = pgEnum('transaction_action', ['BORROW', 'RETURN', 'MISSING_UNEXPECTED'])

// 2.1 Identity & Access Control

// User Profiles - Extended user data linked to Supabase Auth
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // References auth.users(id)
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: userRoleEnum('role').default('USER').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Locations - Physical storage units
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const locations: any = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: locationTypeEnum('type').notNull(),
  parentId: integer('parent_id').references(() => locations.id),
  isRestricted: boolean('is_restricted').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Access Permissions - Managed access for restricted locations
export const accessPermissions = pgTable('access_permissions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users(id)
  locationId: integer('location_id').references(() => locations.id).notNull(),
  status: permissionStatusEnum('status').default('PENDING').notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  requestReason: text('request_reason'),
  approvedBy: uuid('approved_by'), // References auth.users(id)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Physical Cards - NFC/RFID Card binding
export const userCards = pgTable('user_cards', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users(id)
  cardUid: varchar('card_uid', { length: 50 }).unique().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// 2.2 Inventory Definition

// Item Types - SKU/Category Definitions
export const itemTypes = pgTable('item_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: itemCategoryEnum('category'),
  description: text('description'),
  imageUrl: text('image_url'),
  maxBorrowDuration: interval('max_borrow_duration').default('7 days'),
  totalQuantity: integer('total_quantity').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Items - Individual physical instances
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemTypeId: integer('item_type_id').references(() => itemTypes.id).notNull(),
  rfidTag: varchar('rfid_tag', { length: 100 }).unique().notNull(),
  status: itemStatusEnum('status').default('AVAILABLE').notNull(),
  homeLocationId: integer('home_location_id').references(() => locations.id),
  currentHolderId: uuid('current_holder_id'), // References auth.users(id)
  dueAt: timestamp('due_at', { withTimezone: true }),
  lastOverdueNoticeSentAt: timestamp('last_overdue_notice_sent_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 2.3 Session Engine

// Cabinet Sessions - One complete interaction (Open -> Close)
export const cabinetSessions = pgTable('cabinet_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cabinetId: integer('cabinet_id').references(() => locations.id).notNull(),
  userId: uuid('user_id').notNull(), // References auth.users(id)
  startTime: timestamp('start_time', { withTimezone: true }).defaultNow().notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  status: sessionStatusEnum('status').default('ACTIVE').notNull(),
  snapshotStartRfids: jsonb('snapshot_start_rfids'),
  snapshotEndRfids: jsonb('snapshot_end_rfids'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Inventory Transactions - Atomic events calculated from the session
export const inventoryTransactions = pgTable('inventory_transactions', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').references(() => cabinetSessions.id, { onDelete: 'cascade' }).notNull(),
  itemId: uuid('item_id').references(() => items.id).notNull(),
  userId: uuid('user_id').notNull(), // References auth.users(id)
  actionType: transactionActionEnum('action_type').notNull(),
  evidenceImagePath: text('evidence_image_path'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
})

// Types
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert
export type AccessPermission = typeof accessPermissions.$inferSelect
export type NewAccessPermission = typeof accessPermissions.$inferInsert
export type UserCard = typeof userCards.$inferSelect
export type NewUserCard = typeof userCards.$inferInsert
export type ItemType = typeof itemTypes.$inferSelect
export type NewItemType = typeof itemTypes.$inferInsert
export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type CabinetSession = typeof cabinetSessions.$inferSelect
export type NewCabinetSession = typeof cabinetSessions.$inferInsert
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert
