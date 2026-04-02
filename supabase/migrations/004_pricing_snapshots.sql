-- ============================================================
-- 004: Pricing snapshots
-- ============================================================
-- Stores Claude pricing suggestions and manual pricing configs
-- so admins can track pricing decisions over time.
-- ============================================================

create table public.pricing_snapshots (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  connection_id   uuid references public.api_connections(id) on delete set null,
  snapshot_type   text not null check (snapshot_type in ('ai_suggestion', 'manual', 'heatmap')),
  name            text,
  -- Input parameters that produced this snapshot
  inputs          jsonb not null default '{}'::jsonb,
  -- Example inputs:
  -- {
  --   "avg_cost_per_run": 0.05,
  --   "avg_runs_per_user": 10,
  --   "current_users": 5
  -- }
  -- The result (AI suggestion JSON, tier configs, or heatmap data)
  result          jsonb not null default '{}'::jsonb,
  -- Example result for ai_suggestion:
  -- {
  --   "tiers": [...],
  --   "reasoning": "...",
  --   "confidence": "high"
  -- }
  notes           text,
  created_at      timestamptz not null default now()
);

comment on table public.pricing_snapshots is 'Historical pricing suggestions and configs';

create index idx_pricing_snapshots_owner on public.pricing_snapshots (owner_id);
create index idx_pricing_snapshots_type on public.pricing_snapshots (snapshot_type);

-- RLS
alter table public.pricing_snapshots enable row level security;

create policy "Users can manage own snapshots"
  on public.pricing_snapshots for all
  using (auth.uid() = owner_id);

create policy "Admins can read all snapshots"
  on public.pricing_snapshots for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
