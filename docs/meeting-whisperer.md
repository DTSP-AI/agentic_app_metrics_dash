# Meeting Whisperer Integration

Meeting Whisperer is the first backend integrated with this dashboard.

## Architecture

```
Browser (this dashboard)
  │
  ├── Supabase Auth (email/password)
  │   └── JWT token
  │
  └── Meeting Whisperer Backend (FastAPI on Render)
      ├── /api/v1/admin/role-check
      ├── /api/v1/admin/usage/*
      └── /api/v1/admin/pricing/suggest
```

## Backend Components (in Meeting_Agent repo)

| File | Purpose |
|------|---------|
| `backend/app/routers/admin.py` | 10 admin API endpoints |
| `backend/app/services/usage_tracker.py` | Fire-and-forget LLM usage logger |
| `backend/app/auth.py` | ADMIN_EMAILS + require_admin dependency |

## Instrumented LLM Call Sites

Usage tracking is already wired into 10 LLM call sites across the pipeline:
- Detection node
- Retrieval node
- Advisory node
- Brief generation
- Debrief distillation
- Chat endpoints
- Entity extraction
- And others

## Admin Users

- pete@deal-whisper.com
- mike@deal-whisper.com

## Environment (Local Dev)

```
NEXT_PUBLIC_APP_NAME=Meeting Whisperer Admin
NEXT_PUBLIC_API_URL=http://localhost:8005
NEXT_PUBLIC_SUPABASE_URL=https://yvojpfsljignnuddytxw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Deployment Target

- Domain: admin.meeting-whisper.com
- Host: Vercel
- Backend: Render (existing Meeting Whisperer deployment)
