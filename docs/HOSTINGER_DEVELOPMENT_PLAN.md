# CardNexus — Hostinger SaaS Development Plan

This is the development fork of [brightcolor/cardnexus](https://github.com/brightcolor/cardnexus).
All work must stay in this fork and use feature branches; do not modify upstream.

## Goal
Build a self-hosted digital business card + NFC/QR + contact exchange and lead capture SaaS, deployable on the existing Hostinger web app hosting (not a VPS) while keeping the current `aqar1.com` website completely untouched.

## Proposed architecture (subject to verification)
- Next.js 16 / React (existing)
- Node.js 22 or 24 on Hostinger; verify build/runtime configuration and supported version
- Hostinger MySQL or MariaDB for persistent user, organization, card, lead, and event data
- Prisma with MySQL datasource; migrate schema carefully and test migrations
- Better Auth with MySQL adapter configuration and reliable production cookies/sessions
- Cloudflare R2 for persistent uploaded images, with scoped storage keys and size/type validation
- HTTP email provider API (or tested supported SMTP) for invitations, password resets, and lead alerts
- Custom subdomain for the new application; **never reuse or overwrite `aqar1.com`**

## Milestones
- [x] Create fork in personal GitHub account
- [x] Create isolated development branch `develop/hostinger-saas`
- [ ] Run baseline install, lint/typecheck, build, and functionality tests
- [ ] Investigate Hostinger's actual Node.js app runtime and whether Prisma engine/package size fits
- [ ] Convert `prisma/schema.prisma` from SQLite to MySQL with correct column types and indexes
- [ ] Update `lib/db.ts` and `lib/auth.ts`; test login, signup, reset, TOTP, roles, organizations
- [ ] Replace local `fs` image upload and fetch endpoints with Cloudflare R2
- [ ] Validate SMTP or implement an email API for transactional messages
- [ ] Review `proxy.ts`, authentication redirects, session cookies and custom-domain logic in hosting environment
- [ ] Review and harden public lead capture: consent, rate limits, anti-abuse, retention, CSV export
- [ ] Add NFC tag setup flow (write only a stable HTTPS card URL to NTAG215)
- [ ] Verify public card, QR, vCard, lead submission, UTM attribution and dashboard
- [ ] Publish only to a new development subdomain; run acceptance tests before production

## Important security checklist
- Never deploy demo seed accounts or default admin credentials from `prisma/seed.ts` to production
- Never commit credentials, database URLs, private keys or R2 API tokens to GitHub
- Public visitors cannot silently share their phone/email via NFC: only explicit submission/contact selection
- Enforce data isolation for each organization and card owner; test all API endpoints
- Rate limit login/lead endpoints with a production-appropriate strategy
- Restrict file uploads and ensure persistent storage outside the ephemeral app build

## Acceptance criteria
- `aqar1.com` remains unchanged
- The app can restart or redeploy without losing leads, accounts or images
- NFC card opens its unique public profile on Android and iPhone (as supported by the devices)
- Contact saving, lead capture, dashboard and access controls work end to end
- Production seed credentials are disabled and security checks pass

No deployment or production DNS changes are authorized by this planning file.
