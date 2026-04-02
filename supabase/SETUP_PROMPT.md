# Supabase DB Browser Agent Setup Prompt

Copy everything below the line into the Supabase SQL Editor (or DB browser agent) for the **Agentic Dash** project.

---

## Step 1: Run Migrations (in order)

Run each migration file in the SQL Editor, one at a time, in order:

1. `001_profiles.sql` — Profiles table, auto-create trigger, RLS
2. `002_api_connections.sql` — API connections table, seeds Meeting Whisperer
3. `003_saved_projections.sql` — Saved revenue projection scenarios
4. `004_pricing_snapshots.sql` — Pricing suggestion history
5. `005_dashboard_settings.sql` — Per-user dashboard preferences

## Step 2: Create Admin Users

After migrations are complete, create the two admin users via Supabase Auth.
Go to **Authentication > Users > Add User** (or use the Management API):

```
User 1:
  Email: pete@deal-whisper.com
  Password: n&&N4nZxHgvk8un

User 2:
  Email: mike@deal-whisper.com
  Password: (set a secure password — ask Pete)
```

The `on_auth_user_created` trigger will automatically create profile rows with `is_admin = true` for these emails.

## Step 3: Verify Setup

Run these verification queries:

```sql
-- Check profiles were created with admin flag
select id, email, is_admin, created_at from public.profiles;

-- Check Meeting Whisperer seed row exists
select slug, name, api_url, is_active from public.api_connections;

-- Check all tables exist
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected tables: `api_connections`, `dashboard_settings`, `pricing_snapshots`, `profiles`, `saved_projections`

## Step 4: Get Credentials for .env.local

From the Supabase dashboard, go to **Settings > API** and grab:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/public key>
```

These go into:
- `.env.local` in the repo (local dev)
- Vercel env vars (production deployment)

## Step 5: Verify Auth Flow

1. Start the dashboard: `npm run dev` (port 3006)
2. Go to http://localhost:3006/login
3. Sign in as pete@deal-whisper.com
4. Should redirect to /dashboard
5. Dashboard should show "Verifying access..." then load tabs

Note: The backend admin API role check (`/api/v1/admin/role-check`) still uses the **Meeting Whisperer Supabase project's** JWT. If you want the dashboard to use this new Supabase project for auth, the Meeting Whisperer backend needs to be configured to accept JWTs from this project too (add the JWT secret to the backend's auth verification).

## Architecture Note

```
This Supabase Project (Agentic Dash)     Meeting Whisperer Supabase
├── auth.users (admin login)              ├── auth.users (end users)
├── profiles (admin roles)                ├── api_usage_logs (LLM tracking)
├── api_connections (backend configs)     ├── meetings, briefs, etc.
├── saved_projections                     └── ...
├── pricing_snapshots
└── dashboard_settings

Dashboard Frontend (Next.js)
├── Auth: reads from THIS Supabase (login, JWT)
└── Data: reads from Meeting Whisperer backend API (usage, costs, pricing)
```

**Important**: The JWT from this Supabase project won't automatically work against the Meeting Whisperer backend. Options:
1. Share the same JWT secret between both Supabase projects (not recommended)
2. Keep using the Meeting Whisperer Supabase for auth (simpler — same anon key in .env.local)
3. Add this project's JWT secret to the MW backend's verification (proper multi-project auth)

For immediate use, option 2 is simplest — just use the Meeting Whisperer Supabase credentials in .env.local. The tables in this project are ready for when you want full separation.
