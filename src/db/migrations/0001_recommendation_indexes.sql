-- Migration: Add indexes for RAG recommendation performance
-- These indexes optimize the availability and popularity scoring queries

-- Index for availability scorer: quickly count items by type and status
-- Used in: availability-scorer.ts getAvailabilityInfo()
-- Query pattern: WHERE item_type_id IN (...) GROUP BY item_type_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_item_type_status
  ON items(item_type_id, status);

-- Index for popularity scorer: quickly count transactions by item
-- Used in: popularity-scorer.ts getPopularityInfo()
-- Query pattern: JOIN items -> WHERE item_type_id IN (...) AND action_type = 'BORROW'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_item_action
  ON inventory_transactions(item_id, action_type)
  INCLUDE (performed_at);

-- Index for item lookup by type (used in multiple places)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_home_location
  ON items(item_type_id, home_location_id)
  WHERE home_location_id IS NOT NULL;

-- ============================================
-- Hybrid Search Indexes (Full-Text Search)
-- ============================================

-- GIN index for full-text search on item_types
-- Enables fast keyword matching alongside semantic search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_types_fts
  ON item_types
  USING gin(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- Additional index for Chinese text search (if needed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_types_fts_cn
  ON item_types
  USING gin(to_tsvector('simple', COALESCE(name_cn_simplified, '') || ' ' || COALESCE(description_cn, '')));

-- Trigram index for fuzzy matching (handles typos)
-- Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_types_trgm_name
  ON item_types
  USING gin(name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_types_trgm_desc
  ON item_types
  USING gin(description gin_trgm_ops);
