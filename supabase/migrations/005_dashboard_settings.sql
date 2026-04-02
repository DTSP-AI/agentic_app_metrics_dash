-- ============================================================
-- 005: Dashboard settings (per-user preferences)
-- ============================================================
-- Stores user-level dashboard preferences like default tab,
-- default time range, preferred connection, theme overrides, etc.
-- ============================================================

create table public.dashboard_settings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.profiles(id) on delete cascade,
  -- Active backend connection
  active_connection_id uuid references public.api_connections(id) on delete set null,
  -- UI preferences
  preferences     jsonb not null default '{}'::jsonb,
  -- Example preferences:
  -- {
  --   "default_tab": "usage",
  --   "default_days": 30,
  --   "cost_format": "detailed",
  --   "chart_animations": true
  -- }
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.dashboard_settings is 'Per-user dashboard preferences and active connection';

-- RLS
alter table public.dashboard_settings enable row level security;

create policy "Users can manage own settings"
  on public.dashboard_settings for all
  using (auth.uid() = user_id);

create trigger dashboard_settings_updated_at
  before update on public.dashboard_settings
  for each row execute function public.set_updated_at();
