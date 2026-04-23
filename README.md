# PR Review Agent

> AI-powered code review that thinks like a senior engineer. Paste a GitHub PR URL → get structured feedback on scalability, security, and code quality in under 10 seconds.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-v7-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![BullMQ](https://img.shields.io/badge/BullMQ-Redis-red?style=flat-square)](https://bullmq.io)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-orange?style=flat-square)](https://groq.com)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)](https://clerk.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## What This Does

Paste any public GitHub Pull Request URL. The agent:

1. **Fetches the diff** via the GitHub REST API
2. **Chunks it intelligently** by file and hunk boundaries (≤ 3 000 tokens/chunk)
3. **Sends each chunk to Groq** (Llama 3.3 70B) with a structured engineering prompt
4. **Merges & deduplicates** results across all chunks
5. **Returns a scored report** — 0–100 quality score, per-file comments, severity levels, and sub-scores for scalability, security, and code quality
6. **Emails a summary** via Resend when the job completes

All processing happens **asynchronously via BullMQ** — the API returns `202 Accepted` immediately; the frontend polls until done.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App Router                      │
│                                                                 │
│  POST /api/review         GET /api/review/:id    Webhook        │
│       │                         │                   │           │
│       ▼                         ▼                   │           │
│  Validate + Rate Limit    Poll DB status     Verify HMAC        │
│       │                                             │           │
│       └────────────────────────┬────────────────────┘           │
│                                ▼                                │
│                    addReviewJob() → BullMQ Queue                │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Upstash Redis          │
                    │   (job queue + state)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   reviewWorker.ts        │
                    │   (BullMQ Worker)        │
                    │                         │
                    │  1. fetchPRData()        │
                    │  2. chunkDiff()          │
                    │  3. reviewChunk() × N    │
                    │  4. mergeResults()       │
                    │  5. prisma.update()      │
                    │  6. resend.send()        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Supabase PostgreSQL    │
                    │   (Prisma v7 ORM)        │
                    └─────────────────────────┘
```

---

## Key Engineering Decisions

### Why BullMQ over direct API calls
PR reviews take 5–30 seconds depending on diff size. Handling this synchronously would timeout on serverless platforms (Vercel's 10s limit). BullMQ decouples the HTTP request from processing — the API returns `202` immediately, the worker processes in the background, and the frontend polls for completion. Retries use exponential backoff (5 s → 10 s → 20 s, max 3 attempts).

### Why diff chunking
Groq's Llama 3.3 70B has a finite context window. Large PRs (500+ lines across many files) exceed this if sent as one request. We chunk by **file boundaries** first, then by **hunk boundaries** for oversized files. Each chunk is semantically coherent — the AI sees complete file changes, not arbitrary character splits. Max 3 000 tokens per chunk (safe free-tier limit).

### Why Groq over OpenAI
Groq's free tier provides ~14 400 requests/day with significantly faster inference than OpenAI's free options. Llama 3.3 70B is capable enough for structured code review at portfolio scale — zero API cost during development.

### Why Supabase + Prisma v7
Reviews, users, and job state require relational integrity. Supabase provides hosted PostgreSQL with connection pooling (PgBouncer). Prisma v7 separates migration-time and runtime connections via `prisma.config.ts` — the schema stays clean, no `url`/`directUrl` duplication.

### What I would change at production scale
- Store diffs in S3/R2 instead of re-fetching from GitHub on every view
- Add a `webhook_repo` → `user_id` mapping table instead of `findFirst()` in the webhook handler
- Replace 3 s polling with Server-Sent Events or WebSockets for real-time status
- Add integration tests for the worker pipeline (chunkDiff → reviewChunk → mergeResults)
- Horizontal worker scaling with separate Railway/Render service

---

## Tech Stack

| Layer | Tool | Reason |
|---|---|---|
| Framework | Next.js 16 App Router | Full-stack in one repo, server components |
| Auth | Clerk | GitHub OAuth, session management, free tier |
| Database | Supabase PostgreSQL | Hosted Postgres, PgBouncer pooling |
| ORM | Prisma v7 | Type-safe queries, migration-safe config |
| Queue | BullMQ + Upstash Redis | Async job processing, retries, deduplication |
| AI | Groq (Llama 3.3 70B) | Fast inference, free tier, structured output |
| Email | Resend | 3 000 free emails/month, review completion alerts |
| Monitoring | BetterStack + Sentry | Structured logs, error tracking |
| UI | shadcn/ui + Tailwind CSS v4 | Accessible components, design system |
| Deployment | Vercel (app) + separate process (worker) | Native Next.js support |

---

## Running Locally

### Prerequisites
- Node.js ≥ 18
- Accounts for: [Clerk](https://clerk.com), [Supabase](https://supabase.com), [Upstash](https://upstash.com), [Groq](https://console.groq.com), [Resend](https://resend.com), [GitHub token](https://github.com/settings/tokens)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/Shubham37204/Pr-Review-Agent.git
cd Pr-Review-Agent
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in values from each service dashboard (see .env.local.example)

# 3. Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# 4. Start the Next.js dev server
npm run dev

# 5. Start the BullMQ worker (separate terminal — required for reviews to process)
npm run worker
```

> **Note:** Both processes must run simultaneously. The Next.js app queues jobs; the worker processes them. In production, deploy as two separate services pointing to the same Redis + PostgreSQL.

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection (pgbouncer) |
| `DIRECT_URL` | Supabase direct connection (for migrations) |
| `GROQ_API_KEY` | Groq API key |
| `UPSTASH_REDIS_URL` | Redis URL from Upstash (use `rediss://` for TLS) |
| `GITHUB_TOKEN` | GitHub personal access token (public repo read) |
| `GITHUB_WEBHOOK_SECRET` | Secret for HMAC webhook verification |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |

---

## Project Structure

```
pr-review-agent/
├── app/
│   ├── api/
│   │   ├── review/           # POST (submit), GET /:id (poll), GET /:id/diff
│   │   └── webhook/          # GitHub PR webhook (HMAC-verified)
│   ├── dashboard/            # Protected dashboard pages
│   │   ├── compare/          # Score comparison across re-reviews
│   │   ├── history/          # Full review history
│   │   ├── settings/         # Usage & insights analytics
│   │   └── webhooks/         # Webhook setup & status
│   ├── review/[id]/          # Live-polling review detail page
│   └── page.tsx              # Landing page
├── components/
│   ├── dashboard/            # StatCard, OverviewCharts, ActivityFeed
│   ├── layout/               # Sidebar, Footer, Header
│   ├── review/               # ReviewList, PRInputForm, DiffViewer
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── github/               # fetchPR, chunkDiff
│   ├── groq/                 # reviewPrompt, groqClient
│   ├── queue/                # reviewQueue, addJob
│   └── prisma/               # Prisma client singleton
├── workers/
│   ├── reviewWorker.ts       # BullMQ worker — core processing pipeline
│   └── index.ts              # Worker entry point
├── prisma/schema.prisma      # DB schema (User, Review, ReviewStatus)
├── prisma.config.ts          # Prisma v7 datasource config
└── workflow.txt              # Technical workflow documentation
```

---

## Key Numbers

| Metric | Value |
|---|---|
| Avg review time | < 10 s (small PRs), < 60 s (large PRs) |
| Max tokens per chunk | 3 000 (Groq free-tier safe) |
| Daily review limit | 10 reviews per user |
| Worker concurrency | 2 parallel jobs |
| Job retry policy | 3 attempts, exponential backoff (5 s, 10 s, 20 s) |
| Queue deduplication | By `jobId = review-{reviewId}` |

---

## Webhook Setup

To auto-trigger reviews when a PR is opened:

1. Go to your GitHub repo → **Settings → Webhooks → Add webhook**
2. Set Payload URL to: `https://your-app.vercel.app/api/webhook`
3. Set Content type: `application/json`
4. Set Secret: value of your `GITHUB_WEBHOOK_SECRET`
5. Select events: **Pull requests** only
6. Click **Add webhook**

The server verifies every request using SHA-256 HMAC (`timingSafeEqual` to prevent timing attacks).

---

## License

MIT — see [LICENSE](LICENSE)