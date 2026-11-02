/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  BETTER_AUTH_SECRET: string;
  APP_URL: string;
  BETTER_AUTH_URL: string;
  BREVO_API_KEY: string;
  EMAIL_FROM: string;
  EMAIL_FROM_NAME?: string;
}

declare module "cloudflare:workers" {
  export const env: Env;
  export function waitUntil(promise: Promise<unknown>): void;
}
