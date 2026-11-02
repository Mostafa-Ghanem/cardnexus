import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { bindings as env } from "./cloudflare-bindings";

// Cloudflare binding is request-context aware. Do not use a global singleton
// PrismaClient: it can retain the wrong request's D1 handle across invocations.
// Query API shape stays unchanged for all existing routes and server components.
export const db = new PrismaClient({
  adapter: new PrismaD1(env.DB as unknown as ConstructorParameters<typeof PrismaD1>[0]),
  log: ["error"],
});
