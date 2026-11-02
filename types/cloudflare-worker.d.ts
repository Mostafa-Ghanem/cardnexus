import type { CloudflareBindings } from "../lib/cloudflare-bindings";
declare global {
  interface Env extends CloudflareBindings {}
}
