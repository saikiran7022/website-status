# WebsiteStatus — Uptime Monitoring SaaS

A full-featured, multi-tenant uptime monitoring platform built with Next.js 14, Prisma, and PostgreSQL. Sign up, add monitors, get alerted when things break, and share a public status page with your customers.

## Features

- 🔐 **Authentication** — email/password (JWT sessions) + optional GitHub OAuth, email verification, and password reset
- 🏢 **Multi-tenant organizations** — every account gets an org; invite members as **Admin**, **Editor**, or **Viewer**
- 📊 **Uptime monitoring** — HTTP/HTTPS checks with custom method, headers, body, timeout, expected status code, and keyword matching; automatic retries to avoid flapping
- ⏱️ **Continuous checking** — a long-running worker (node-cron) checks each monitor on its own interval; a secured `/api/cron` endpoint is also available for serverless schedulers
- 📈 **Dashboards** — 90-day uptime timelines, response-time charts, and 24h/7d/30d uptime
- 🔔 **Alerts** — email (via Resend) and outbound webhooks on incident open/resolve, with a delivery audit log
- 🚨 **Incident management** — auto-created incidents on outages (auto-resolved on recovery) plus manual incidents with a timeline
- 🌐 **Public status pages** — branded, per-org status page on a custom slug (`/status/<slug>`)
- 🔑 **REST API** — manage monitors and read uptime with API-key authentication
- 💳 **Plans & limits** — Free / Pro / Enterprise tiers with enforced monitor and member limits
- 🌙 **Dark mode** and a responsive UI

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma ORM** + **PostgreSQL**
- **Tailwind CSS** + shadcn/ui (Radix) components
- **JWT** sessions (`jsonwebtoken`) + **bcryptjs**
- **Recharts**, **Sonner**, **next-themes**
- **node-cron** background worker
- **Resend** HTTP API for transactional email (optional)

## Getting Started

### Prerequisites
- Node.js 22+
- PostgreSQL 14+

### Installation

```bash
npm install
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
npm run db:push             # sync the schema to your database
npm run seed                # optional: demo org, admin user, sample monitors
npm run dev                 # http://localhost:3000
```

In a separate terminal, start the check worker:

```bash
npm run worker
```

The seed creates an admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, default `admin@example.com` / `admin12345`).

## Configuration

All configuration is via environment variables — see `.env.example`. Highlights:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ (prod) | Signs session JWTs; must be ≥16 chars in production |
| `NEXT_PUBLIC_APP_URL` | ✅ | Base URL used in emails and OAuth redirects |
| `WORKER_CRON` | — | Worker schedule (default `* * * * *`) |
| `CRON_SECRET` | — | Bearer secret required to call `/api/cron` |
| `RESEND_API_KEY`, `EMAIL_FROM` | — | Enable email; if unset, email is skipped gracefully |
| `GITHUB_CLIENT_ID/SECRET`, `NEXT_PUBLIC_GITHUB_CLIENT_ID` | — | Enable GitHub OAuth |

## Deployment (Render)

The `render.yaml` provisions three resources: the **Next.js web service**, a **background worker** (continuous checks), and a **PostgreSQL database**. `JWT_SECRET` and `CRON_SECRET` are generated automatically; set the `sync: false` secrets (email/OAuth/admin) in the dashboard.

For serverless platforms, skip the worker and instead schedule a call to `GET /api/cron` (authenticated with `CRON_SECRET`).

## REST API

Authenticate with an API key (create one under **Settings → API Keys**):

```bash
# List monitors
curl -H "Authorization: Bearer ws_your_api_key" https://your-domain.com/api/v1/monitors

# Get a monitor's current status and recent checks
curl -H "Authorization: Bearer ws_your_api_key" https://your-domain.com/api/v1/monitors/<id>/status

# Uptime (24h / 7d / 30d) per monitor
curl -H "Authorization: Bearer ws_your_api_key" https://your-domain.com/api/v1/uptime
```

## Project Structure

```
├── prisma/                 # Prisma schema + migrations
├── scripts/worker.ts       # long-running node-cron check worker
└── src/
    ├── app/
    │   ├── (auth)/          # login, signup, verify, reset
    │   ├── dashboard/       # protected app (monitors, alerts, incidents, status pages, settings)
    │   ├── status/[slug]/   # public status page
    │   └── api/             # REST endpoints (internal + /api/v1 + /api/cron)
    ├── components/          # UI, charts, layout
    └── lib/
        ├── auth/            # JWT, sessions, request auth, GitHub OAuth
        ├── checker/         # check engine (retries, incident reconciliation)
        ├── notifications/   # email (Resend) + webhook dispatch
        ├── plans.ts         # plan limits
        └── db.ts            # Prisma client
```

## Testing

```bash
npm test
```

## License

MIT
