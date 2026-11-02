// Generate an initial SQLite schema migration for a fresh D1 database.
// Do NOT regenerate against an existing live database without reviewing diffs.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("migrations", { recursive: true });
const sql = execFileSync("npx", [
  "prisma", "migrate", "diff",
  "--from-empty", "--to-schema-datamodel", "prisma/schema.prisma", "--script",
], { encoding: "utf8", stdio: ["ignore","pipe","inherit"] });
writeFileSync("migrations/0001_init.sql", sql, "utf8");
console.log("Generated migrations/0001_init.sql — review before applying remotely.");
