// Run only on an empty dedicated test database during the first Hostinger build.
// The actual schema update is performed by Prisma after this deliberate opt-in.
const url = process.env.DATABASE_URL || "";
if (process.env.HOSTINGER_INITIAL_SETUP !== "true") {
  console.error("Initial database setup is disabled. Set HOSTINGER_INITIAL_SETUP=true for one first deployment only.");
  process.exit(1);
}
if (!/^mysql:\/\/[^\s]+@[^\s/]+:\d+\/[a-zA-Z0-9_]+(?:\?.*)?$/.test(url)) {
  console.error("A dedicated MySQL DATABASE_URL must be configured first.");
  process.exit(1);
}
console.log("Initial MySQL schema setup was explicitly enabled. Use only a new empty database.");
