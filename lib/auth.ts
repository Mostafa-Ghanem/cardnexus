import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { db } from "./db";

// Hostinger can assign its own internal process port. Auth must expose the
// actual HTTPS origin rather than a hard-coded localhost:3000 address.
const publicUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.APP_URL ??
  "http://localhost:3000";

export const auth = betterAuth({
  baseURL: publicUrl,
  database: prismaAdapter(db, {
    provider: "mysql",
  }),
  advanced: {
    // Force Secure cookie flag when the public-facing URL is HTTPS.
    // Required when TLS is terminated at the reverse proxy.
    useSecureCookies: publicUrl.startsWith("https"),
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import("./email");
      try { await sendPasswordResetEmail({ to: user.email, url }); }
      catch (e) { console.error("[auth] sendResetPassword failed", e); }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  trustedOrigins: [
    publicUrl,
    process.env.APP_URL ?? "",
    process.env.NEXT_PUBLIC_APP_URL ?? "",
  ].filter(Boolean),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "member",
        required: false,
        input: false,
      },
      organizationId: {
        type: "string",
        required: false,
        input: false,
      },
      // Subscription plan — set by server/webhooks only, never by client
      plan: {
        type: "string",
        defaultValue: "free",
        required: false,
        input: false,
      },
      planExpiresAt: {
        type: "date",
        required: false,
        input: false,
      },
      stripeCustomerId: {
        type: "string",
        required: false,
        input: false,
      },
      stripeSubscriptionId: {
        type: "string",
        required: false,
        input: false,
      },
      paypalSubscriptionId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    // TOTP-based 2FA. The plugin manages /two-factor/* endpoints,
    // a `twoFactor` table and the `user.twoFactorEnabled` field.
    twoFactor({
      issuer: process.env.APP_NAME ?? process.env.NEXT_PUBLIC_APP_NAME ?? "CardNexus",
      // Force the user to verify a TOTP code before enabling 2FA —
      // protects against typos in the authenticator setup.
      skipVerificationOnEnable: false,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
