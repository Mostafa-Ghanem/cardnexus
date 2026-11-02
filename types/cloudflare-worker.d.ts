// Minimal Worker ambient types without importing the entire Workers lib.
// Importing the full @cloudflare/workers-types globally changes browser
// Response.json() to Promise<unknown> and breaks existing React components.
declare module "cloudflare:workers" {
  export const env: unknown;
  export function waitUntil(promise: Promise<unknown>): void;
}

type Env = import("../lib/cloudflare-bindings").CloudflareBindings;
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
interface ScheduledController {
  scheduledTime: number;
  cron: string;
}
