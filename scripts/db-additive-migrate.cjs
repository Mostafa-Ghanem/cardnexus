#!/usr/bin/env node
/**
 * Add-only database migration, run automatically before `next build`.
 *
 * Production was created once with `prisma db push` and must never be
 * re-initialised. This script only ADDS columns that newer code needs and
 * that are missing. It never drops, renames or modifies existing columns,
 * never deletes rows and is safe to run on every deploy (idempotent).
 *
 *   SKIP_DB_MIGRATIONS=true   skip entirely (e.g. image builds without a DB)
 *
 * Keep every entry in sync with prisma/schema.prisma.
 */
const { PrismaClient } = require("@prisma/client");

const COLUMNS = [
  { table: "twoFactor", column: "failedVerificationCount", ddl: "INT NOT NULL DEFAULT 0" },
  { table: "user",      column: "telegramChatId",          ddl: "VARCHAR(191) NULL" },
  { table: "Lead",      column: "status",                  ddl: "VARCHAR(191) NOT NULL DEFAULT 'new'" },
  { table: "Lead",      column: "note",                    ddl: "TEXT NULL" },
  { table: "Card",      column: "whatsapp",                ddl: "VARCHAR(191) NULL" },
  { table: "Card",      column: "translations",            ddl: "TEXT NULL" },
];

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

async function main() {
  if (process.env.SKIP_DB_MIGRATIONS === "true") {
    console.log("[db-migrate] SKIP_DB_MIGRATIONS=true — skipped.");
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.warn("[db-migrate] DATABASE_URL is not set — skipped (no database to update).");
    return;
  }

  const db = new PrismaClient();
  try {
    const tables = await db.$queryRawUnsafe(
      "SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"
    );
    const existingTables = new Set(tables.map((r) => r.t));
    if (!existingTables.has("Card")) {
      // Empty database: the one-time initial setup (prisma db push) creates everything.
      console.log("[db-migrate] Tables not created yet — nothing to add (initial setup creates them).");
      return;
    }

    let added = 0;
    for (const { table, column, ddl } of COLUMNS) {
      if (!IDENT.test(table) || !IDENT.test(column)) throw new Error(`unsafe identifier ${table}.${column}`);
      if (!existingTables.has(table)) {
        console.warn(`[db-migrate] table ${table} missing — skipped ${column}`);
        continue;
      }
      const rows = await db.$queryRawUnsafe(
        "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
        table, column
      );
      if (Number(rows[0].n) > 0) continue;
      console.log(`[db-migrate] ADD COLUMN \`${table}\`.\`${column}\` ${ddl}`);
      await db.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
      added++;
    }
    console.log(added ? `[db-migrate] done, ${added} column(s) added.` : "[db-migrate] schema already up to date.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("[db-migrate] FAILED — build stopped so the running site stays on the previous version.");
  console.error(err);
  process.exit(1);
});
