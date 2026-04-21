# PR Review Agent

AI-powered code review for GitHub Pull Requests using Groq, Next.js, and BullMQ.

## What This Does

Paste a GitHub PR URL → get a structured code review in under 60 seconds.
Reviews are categorized by severity (critical, warning, suggestion) with a quality score out of 100.

## Architecture Decisions

### Why BullMQ over direct API calls
PR reviews can take 10–30 seconds depending on diff size.
Handling this synchronously in an API route would timeout on Vercel (10s limit on free tier).
BullMQ decouples the HTTP request from the processing — the API returns 202 immediately,
the worker processes in the background, the frontend polls for completion.

### Why diff chunking
Groq's Llama 3.3 70B has a context window limit.
Large PRs (500+ lines across many files) exceed this limit if sent as one request.
We chunk by file boundaries first, then by hunk boundaries for oversized files.
This means each chunk is semantically coherent — the AI sees complete file changes,
not arbitrary character splits.

### Why Groq over OpenAI
Groq's free tier provides ~14,400 requests/day with significantly faster inference
than OpenAI's free options. For a portfolio project, this means zero API cost
while still using a capable model (Llama 3.3 70B).

### Why Supabase PostgreSQL over a simpler DB
Reviews, users, and job state need relational integrity.
Supabase provides a hosted PostgreSQL instance with a free tier sufficient for
portfolio-scale traffic. Prisma provides type-safe queries and schema migrations.

### Why Clerk over NextAuth
Clerk provides GitHub OAuth out of the box with a free tier.
It handles session management, user creation, and token refresh without custom code.
This project uses Clerk only for auth — all user data lives in our own PostgreSQL DB
linked by clerkId.

### What I would change at scale
- Store diffs in S3/R2 instead of re-fetching from GitHub on every view
- Add a webhook → repo mapping table instead of findFirst() in the webhook handler
- Use Prisma connection pooling (PgBouncer) for high concurrency
- Add background job for re-reviewing PRs when new commits are pushed
- Replace polling with WebSockets or Server-Sent Events for real-time updates

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Full stack in one repo |
| Auth | Clerk | GitHub OAuth, free tier |
| Database | Supabase PostgreSQL | Free hosted Postgres |
| ORM | Prisma v7 | Type-safe queries |
| Queue | BullMQ + Upstash Redis | Async job processing |
| AI | Groq API (Llama 3.3 70B) | Free, fast inference |
| Email | Resend | 3000 free emails/month |
| Monitoring | Sentry | Error tracking, session replay |
| Deployment | Vercel | Free, native Next.js support |

## Running Locally

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in values from each service dashboard

# Set up database
npx prisma generate
npx prisma db push

# Run Next.js dev server
npm run dev

# Run worker (separate terminal — must run alongside Next.js)
npm run worker
\`\`\`

## Key Numbers

- PR review time: under 60 seconds for PRs up to 500 lines
- Chunk size: 3000 tokens max per chunk (safe Groq free tier limit)
- Daily limit: 10 reviews per user
- Concurrent jobs: 2 (respects Groq free tier rate limits)
- Email delivery: via Resend on review completion