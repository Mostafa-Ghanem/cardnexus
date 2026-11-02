/**
 * Secure one-time admin bootstrap for a fresh, empty Hostinger MySQL database.
 * Requires explicit credentials via environment variables. Never overwrites users.
 *
 * BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_PASSWORD=... npm run db:bootstrap-admin
 */
import { db } from "../lib/db";
import { hashPassword } from "@better-auth/utils/password";
import { randomUUID } from "node:crypto";

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!process.env.DATABASE_URL?.startsWith("mysql://")) {
    throw new Error("Bootstrap is restricted to an explicitly configured MySQL database.");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
  }
  if (!password || password.length < 16) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 16 characters.");
  }
  const priorAdmin = await db.user.findFirst({ where: { role: "super_admin" }, select: { id: true } });
  if (priorAdmin) throw new Error("A super admin already exists. Refusing to reset or create another one.");
  const priorUser = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (priorUser) throw new Error("The chosen email address is already registered.");

  const now = new Date();
  const userId = randomUUID();
  const passwordHash = await hashPassword(password);

  await db.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        name: "Administrator",
        email,
        emailVerified: true,
        role: "super_admin",
        createdAt: now,
        updatedAt: now,
      },
    });
    await tx.account.create({
      data: {
        id: randomUUID(),
        userId,
        accountId: email,
        providerId: "credential",
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    });
  });
  console.log("Super admin created. Remove BOOTSTRAP_ADMIN_PASSWORD from the environment now.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Admin bootstrap failed");
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
