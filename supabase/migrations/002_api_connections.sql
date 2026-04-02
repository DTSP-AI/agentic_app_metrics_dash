-- ============================================================
-- 002: API connections (multi-backend support)
-- ============================================================
-- Each row represents a backend agent app this dashboard can
-- connect to. Meeting Whisperer is the first entry.
-- Future: users switch between connected apps in the UI.
-- ============================================================

create table public.api_connections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  api_url     text not null,
  logo_path   text,
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.api_connections is 'Backend agent apps this dashboard connects to';

-- RLS
alter table public.api_connections enable row level security;

-- Any authenticated user can read (UI needs connection list before full admin check)
create policy "Authenticated users can read api_connections"
  on public.api_connections for select
  using (auth.uid() is not null);

-- Only admins can write
create policy "Admins can insert api_connections"
  on public.api_connections for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Admins can update api_connections"
  on public.api_connections for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Admins can delete api_connections"
  on public.api_connections for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create trigger api_connections_updated_at
  before update on public.api_connections
  for each row execute function public.set_updated_at();

-- Seed Meeting Whisperer as first connection
insert into public.api_connections (slug, name, api_url, logo_path)
values (
  'meeting-whisperer',
  'Meeting Whisperer',
  'https://meeting-agent-backend.onrender.com',
  '/assets/logo/meeting_whisper_logo.png'
);
