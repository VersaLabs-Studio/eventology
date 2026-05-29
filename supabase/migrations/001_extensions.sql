-- ============================================================================
-- Migration 001: Extensions
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Enables required PostgreSQL extensions for the Eventology platform.
-- These extensions provide: UUID generation, cryptographic functions,
-- geospatial queries (PostGIS), and full-text search (pg_trgm).
-- ============================================================================

-- UUID generation (gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Cryptographic functions (gen_random_bytes, crypt, etc.)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Geospatial support for venue coordinates and location-based queries
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA extensions;

-- Trigram similarity for fuzzy text search (event titles, organizer names)
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;
