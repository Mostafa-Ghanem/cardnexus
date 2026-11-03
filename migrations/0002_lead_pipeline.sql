-- Additive migration for Cloudflare D1 only.
-- Do not copy MySQL migration from Hostinger V4.
-- Applied after the existing migrations/0001_init.sql.
ALTER TABLE "Lead" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'new';
ALTER TABLE "Lead" ADD COLUMN "note" TEXT;
