import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { env } from "cloudflare:workers";

// Cloudflare binding is request-context aware. Do not use a global singleton
// PrismaClient: it can retain the wrong request's D1 handle across invocations.
// Query API shape stays unchanged for all existing routes and server components.
export const db = new PrismaClient({
  adapter: new PrismaD1(env.DB),
  log: ["error"],
});
