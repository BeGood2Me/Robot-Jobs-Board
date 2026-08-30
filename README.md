# Robot Jobs Board

Robotics job board and editorial site. Aggregates public Greenhouse, Lever, Ashby, Workday, and Workable boards, tags each role with a robotics taxonomy, and publishes filterable search plus programmatic SEO pages.

## Stack

- Next.js 16 App Router (`apps/web`) on Vercel
- PostgreSQL on Neon via Prisma (`packages/db`)
- Ingestion scripts (`apps/ingestion`) on Vercel Cron and GitHub Actions
- Keyword taxonomy (`packages/taxonomy`)

## Local setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Set Neon URLs. Use the pooled connection string for `DATABASE_URL`. For Prisma migrations, set `DIRECT_URL` to the direct (non pooler) URL. If you only have one URL, set both to the same value.

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler/dbname?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

3. Install and generate the Prisma client:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

4. Run the Next.js app (and any package watchers):

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Seed data includes sample jobs so the UI works before the first live ingest.

## Ingestion (automatic)

You do not paste job listings. Active `SourceFeedConfig` rows point at public Greenhouse, Lever, Ashby, Workday, or Workable boards. The runner pulls those boards, upserts new and changed jobs, and drops listings that disappear from the feed.

Only jobs in the **United States, United Kingdom, or other European countries** are stored. Listings in Mexico, Brazil, India, Japan, and similar regions are skipped, even when the same company also hires there. Remote roles are kept when the location names the US, UK, or Europe.

Run once locally:

```bash
pnpm ingest:run
```

Ingest for the **public site** does not use Neon. GitHub Actions runs `pnpm snapshot:export:feeds` (~1–2 min): it pulls employer ATS feeds (Greenhouse, Lever, Ashby, Workday, Workable) and commits `apps/web/public/snapshot/`.

Vercel Cron (Hobby, once daily ~08:17 UTC) hits `GET /api/cron/ingest` with `CRON_SECRET` and dispatches that workflow. GitHub’s own schedule is only a backup (it can skip).

Optional Neon ingest (`pnpm ingest:run`) is for admin/DB tooling when the database is available — it is not required for the live board.

You can also click **Sync boards now** on `/admin/jobs`.

## Hide irrelevant jobs

Sign in at `/admin/login` with `ADMIN_SECRET`.

- **Remove from site** hides a listing while it still appears on the source board. Hidden jobs 404 on the public job URL and are omitted from search, sitemaps, and company pages.
- **Restore** puts a hidden listing back on the public board.
- If the employer removes a job from their ATS, the next sync **deletes** it from the database entirely (including hidden copies of that posting).

### Add a company board

1. Insert a `Company` (or reuse seed upserts in `packages/db/src/seed-companies.ts`).
2. Insert `SourceFeedConfig` with `active: true` and JSON config:

| Source | Config keys |
| --- | --- |
| Greenhouse | `{ "boardToken": "locusrobotics" }` |
| Lever | `{ "site": "anybotics" }` |
| Ashby | `{ "jobBoardName": "skydio" }` |
| Workday | `{ "host": "bostondynamics.wd1.myworkdayjobs.com", "tenant": "bostondynamics", "site": "Boston_Dynamics" }` |
| Workable | `{ "site": "exotec" }` |
| Aggregator | `{ "sourceFilter": "greenhouse" }` |

Seeded boards cover humanoids, AMRs, industrial arms, drones, field robots, and warehouse automation. Tokens are only added after the public ATS API returns jobs. Companies on closed ATS products (many Workday/Phenom career sites) are omitted until a public feed is verified.

### Optional aggregator

Set `JOB_LISTINGS_API_KEY` and `JOB_LISTINGS_API_BASE_URL`. If the key is empty, that connector returns no jobs.

LLM classification is stubbed in `@robot-jobs-board/taxonomy` (`LlmClassifier`). Plug in OpenAI or Anthropic later without changing the upsert path.

## Tests

```bash
pnpm test
```

Covers taxonomy rules and ATS field mappers.

## Deploy

### Vercel (web)

- Root of the repo (pnpm workspace)
- Build command: `pnpm db:generate && pnpm --filter web build`
- Output: Next.js default for `apps/web`
- Environment: `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `ADMIN_SECRET`, `INGEST_DISPATCH_TOKEN`

### GitHub Actions (public snapshot)

Workflow: `.github/workflows/ingest.yml` — feed snapshot only (no Neon). Triggered by Vercel Cron dispatch, two GitHub schedule backups, and manual run.

### Google Search Console

1. Deploy with a real `NEXT_PUBLIC_SITE_URL`.
2. Add the domain in Search Console.
3. Submit `https://YOUR_DOMAIN/sitemap.xml`.
4. Confirm `robots.txt` allow rules and the sitemap index.
5. Request indexing on a few job and category URLs after the first ingest.

Removed jobs are deleted from the database and return 404. Category pages with fewer than 5 active jobs also send `noindex`.

## Project layout

```
apps/web          Next.js UI, MDX blog, sitemaps
apps/ingestion    ATS connectors and runner
packages/db       Prisma schema, client, seed
packages/taxonomy Keyword classifier
packages/config   Typed env
```
