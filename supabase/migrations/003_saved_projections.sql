-- ============================================================
-- 003: Saved projection scenarios
-- ============================================================
-- Persists revenue projection configurations so admins can
-- save, compare, and revisit different business scenarios.
-- ============================================================

create table public.saved_projections (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  connection_id   uuid references public.api_connections(id) on delete set null,
  name            text not null,
  description     text,
  -- Projection parameters (stored as JSONB for flexibility)
  parameters      jsonb not null default '{}'::jsonb,
  -- Example parameters shape:
  -- {
  --   "start_users": 5,
  --   "growth_rate": 10,
  --   "license_price": 99,
  --   "avg_runs": 10,
  --   "cost_per_run": 0.05,
  --   "infra_overhead": 20,
  --   "seats_per_user": 2,
  --   "seat_price": 25
  -- }
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.saved_projections is 'Saved revenue projection scenarios per admin';

create index idx_saved_projections_owner on public.saved_projections (owner_id);

-- RLS
alter table public.saved_projections enable row level security;

-- Users own their projections
create policy "Users can manage own projections"
  on public.saved_projections for all
  using (auth.uid() = owner_id);

-- Admins can read all projections
create policy "Admins can read all projections"
  on public.saved_projections for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create trigger saved_projections_updated_at
  before update on public.saved_projections
  for each row execute function public.set_updated_at();
