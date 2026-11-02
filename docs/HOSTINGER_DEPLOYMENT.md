# CardNexus on Hostinger — staged rollout

> Status: **development only**. No Hostinger deployment, DNS change or production database migration has been performed.

## Current state

- Fork: `Mostafa-Ghanem/cardnexus`
- Long-lived integration branch: `develop/hostinger-saas`
- Feature branch: `feature/hostinger-mysql-foundation`
- Next.js 16 with a webpack build script, Node.js 22/24 supported in Hostinger Web Apps
- Prisma MySQL schema replacing SQLite; long strings use native MySQL TEXT
- Better Auth configured for MySQL and for the actual application URL
- Existing upstream demo seed disabled via `npm run db:seed`
- New explicit bootstrap command `npm run db:bootstrap-admin` (16+ character password, one-time only)
- CI: isolated MySQL 8, Prisma validate/db push, admin bootstrap, card/lead data test, TypeScript, ESLint and production build

## Safe deployment sequence — only after CI passes and remaining blockers are resolved

1. Select **Websites → Create site → Web App** on the current Hostinger hosting plan.
2. Create a **new, isolated app**, never use or change the existing `aqar1.com` website.
3. Use a new test domain/subdomain with HTTPS and separate app settings.
4. Create an empty dedicated MySQL database and user; give that account access only to this database.
5. Import the fork from GitHub; select the integrated development branch after review/merge.
6. Set Node.js to **22** (or tested 24), install using `npm ci`, build using `npm run build`.
7. Set these environment variables (use Hostinger's secret manager; do not commit values):
   - `DATABASE_URL=mysql://<db_user>:<encoded-password>@127.0.0.1:3306/<db_name>`
   - `APP_URL=https://<test-subdomain>`
   - `BETTER_AUTH_URL=https://<test-subdomain>`
   - `NEXT_PUBLIC_APP_URL=https://<test-subdomain>`
   - `BETTER_AUTH_SECRET=<cryptographically-random-32-byte-secret>`
8. Initialize the **empty development database only**, using `npx prisma db push` until checked-in reviewed migrations exist. Do not use `db push` on an existing production database.
9. Bootstrap the first administrator by providing `BOOTSTRAP_ADMIN_EMAIL` and a strong `BOOTSTRAP_ADMIN_PASSWORD` (at least 16 characters) temporarily; run `npm run db:bootstrap-admin`. Remove the bootstrap password from the environment immediately after completion.
10. Verify authentication, creating/editing cards, public NFC/QR card URLs, lead submission, analytics and image persistence before making the app publicly accessible.

## Critical blockers still open

- **Uploaded images**: upstream writes to `public/uploads`, which is not dependable across Hostinger redeploys. Move uploads and serving to Cloudflare R2 before production use.
- **Email delivery**: verify Hostinger outbound SMTP support and configure a transactional HTTP email provider if needed. Account invite/reset notifications must work.
- **Production migrations**: checked-in MySQL migration SQL and rollback plan still needed. The current CI uses an isolated disposable database and `prisma db push` only.
- **NFC onboarding and lead capture UX**: later product milestones; NFC does not silently expose visitor contacts.
- **Application security**: verify all organization scoping, rate-limits, session cookies, password flows, and uploaded files before launch.
- **Docker files**: retained from upstream but still target a SQLite volume. Do not use the original `Dockerfile` or `docker-compose.yml` to deploy this MySQL branch.

## How to check progress

The GitHub Actions workflow is `.github/workflows/hostinger-mysql-ci.yml`, and should run on feature branch pushes and pull requests targeting `develop/hostinger-saas`. **A green CI run is not equivalent to a successful Hostinger deployment.**

## No-impact rule

**Do not overwrite, redeploy or repoint `aqar1.com`.** The existing website must remain untouched until a standalone app has passed acceptance tests on a separate domain.
