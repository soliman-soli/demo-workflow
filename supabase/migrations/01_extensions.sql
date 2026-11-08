-- ============================================================================
-- 01: EXTENSIONS
-- Enables cryptographic UUID generation and pgvector for semantic search
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

