# WebsiteStatus - Enterprise Uptime Monitoring

A full-featured SaaS uptime monitoring platform built with Next.js 15, Drizzle ORM, and modern web technologies.

## Features

- 🔐 **Authentication** - Email/password + GitHub OAuth
- 🏢 **Multi-tenant Organizations** - Workspace-based access with roles (Admin, Editor, Viewer)
- 📊 **Uptime Monitoring** - HTTP, HTTPS, TCP, Ping, DNS checks
- 📈 **Dashboards** - 90-day timeline, response time charts, p50/p95/p99 percentiles
- 🔔 **Alerts** - Email and webhook notifications with configurable rules
- 🌐 **Status Pages** - Public status pages with custom branding
- 🚨 **Incident Management** - Track and resolve incidents with timeline updates
- 🔑 **REST API** - Programmatic access with API key authentication
- 🌙 **Dark Mode** - Full dark mode support
- 📱 **Responsive** - Mobile-friendly design

## Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **Tailwind CSS** + shadcn/ui components
- **PostgreSQL** with **Drizzle ORM**
- **Lucia Auth** for authentication
- **Recharts** for data visualization
- **Sonner** for toast notifications

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 14+

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Start the check worker (in a separate terminal):
   ```bash
   npm run worker
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### One-Click Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

The `render.yaml` file configures:
- Next.js web service
- Background check worker
- PostgreSQL database

### Manual Deployment

1. Set up a PostgreSQL database
2. Set all environment variables from `.env.example`
3. Run `npm run build`
4. Start with `npm start`
5. Run the check worker separately with `npm run worker`

## API

The REST API is available at `/api/v1/` with API key authentication.

```bash
# List monitors
curl -H "Authorization: Bearer ws_your_api_key" https://your-domain.com/api/v1/monitors

# Get monitor status
curl -H "Authorization: Bearer ws_your_api_key" https://your-domain.com/api/v1/monitors/:id/status

# Get uptime data
curl -H "Authorization: Bearer ws_your_api_key" https://your-domain.com/api/v1/uptime
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Dashboard pages (protected)
│   │   ├── api/                # API routes
│   │   └── status/[slug]/      # Public status pages
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── charts/             # Data visualization
│   │   └── layout/             # Layout components
│   └── lib/                    # Utilities and business logic
│       ├── db/                 # Database client and queries
│       ├── auth/               # Authentication utilities
│       ├── checker/            # Uptime check engine
│       └── alerts/             # Alert notification engine
├── drizzle/                    # Database schema
├── scripts/                    # Background worker
└── render.yaml                 # Render deployment config
```

## License

MIT
