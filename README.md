# Agent Metrics Dashboard

A reusable admin observability dashboard for agent-based applications. Track LLM usage, analyze costs, model revenue projections, and optimize pricing — all from a polished dark-themed UI.

Built with Next.js 14, TypeScript, Tailwind CSS, and Recharts.

## Features

- **Usage Tracker** — Real-time cost monitoring by model, service/workflow, and daily trends. CSV export. Warning banners for cost spikes.
- **Unit Economics** — Per-run cost analysis, revenue vs cost curves, break-even calculations with interactive pricing controls.
- **Revenue Projections** — 5-year financial projections with configurable growth rates, pricing tiers, and infrastructure overhead.
- **Pricing Optimizer** — Margin heatmap across price points and usage levels. AI-powered pricing suggestions via Claude.

## Quick Start

```bash
git clone https://github.com/DTSP-AI/agentic_app_metrics_dash.git
cd agentic_app_metrics_dash
cp .env.local.example .env.local
# Edit .env.local with your credentials
pnpm install
pnpm dev
```

Dashboard runs at [http://localhost:3006](http://localhost:3006).

## Integration

This dashboard connects to any backend that exposes a standard set of admin API endpoints for LLM usage data. See [docs/integration.md](docs/integration.md) for the full API contract.

### Supported Frameworks

- **LangChain** — callback-based tracing
- **LangGraph** — node-level execution metadata
- **Custom** — any system logging model calls with token counts and costs

### First Integration: Meeting Whisperer

Meeting Whisperer is the first production backend. See [docs/meeting-whisperer.md](docs/meeting-whisperer.md) for specifics.

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Supabase](https://supabase.com/) (browser auth)
- [Lucide React](https://lucide.dev/) (icons)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_NAME` | Display name in header (e.g. "Meeting Whisperer Admin") |
| `NEXT_PUBLIC_API_URL` | Backend admin API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Project Structure

```
app/
  layout.tsx          Root layout (dark theme, providers)
  page.tsx            Auth redirect (-> /dashboard or /login)
  login/page.tsx      Email/password login
  dashboard/page.tsx  4-tab admin dashboard
components/
  Providers.tsx       Auth context wrapper
  dashboard-ui.tsx    Shared UI: StatCard, SliderInput, ChartTooltip, etc.
  UsageTracker.tsx    Tab 1: Usage monitoring
  MeetingCalc.tsx     Tab 2: Unit economics calculator
  RevenueProjections.tsx  Tab 3: 5-year projections
  PricingOptimizer.tsx    Tab 4: Margin heatmap + AI suggestions
lib/
  api.ts              Typed API client with auth, retry, warmup
  auth.tsx            Supabase auth context
  supabase.ts         Supabase browser client
  config.ts           Centralized app config
types/
  metrics.ts          Normalized telemetry types
  pricing.ts          Pricing/projection types
docs/
  integration.md      Generic integration guide
  meeting-whisperer.md  First integration specifics
```

## License

MIT
