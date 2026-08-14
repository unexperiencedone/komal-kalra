-- ============================================================================
-- 00_extensions.sql — required Postgres extensions
-- Run FIRST. Every other file assumes these exist.
-- ============================================================================

-- gen_random_uuid()
create extension if not exists "pgcrypto";

-- btree_gist lets a GiST EXCLUDE constraint mix scalar equality with range
-- overlap. This is what makes the "no two overlapping appointments" constraint
-- in 07_appointments.sql possible. Without it that constraint cannot be created.
create extension if not exists "btree_gist";

-- Fuzzy client lookup in the admin console.
create extension if not exists "pg_trgm";
