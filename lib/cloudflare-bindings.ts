import { env } from "cloudflare:workers";

// Intentionally avoid a global @cloudflare/workers-types reference: that
// changes the browser's Response.json() type to Promise<unknown>, breaking
// client-side Next.js code. These are only the bindings the app consumes.
export interface CloudflareBindings {
  DB: {
    prepare(sql: string): {
      bind(...args: (string | number | boolean | null)[]): {
        first<T>(): Promise<T | null>;
        run(): Promise<unknown>;
      };
    };
  };
  IMAGES: {
    list(options: { prefix: string; limit: number }): Promise<{ objects: unknown[] }>;
    put(key: string, data: Uint8Array, options: {
      httpMetadata: { contentType: string; cacheControl: string };
    }): Promise<unknown>;
    get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  };
  BETTER_AUTH_SECRET: string;
  APP_URL?: string;
  BETTER_AUTH_URL?: string;
  BREVO_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
}
export const bindings = env as unknown as CloudflareBindings;
