# Integration Guide

This dashboard is a generic observability frontend for agent-based applications.
It connects to any backend that exposes a standard set of admin API endpoints for
LLM usage tracking, cost aggregation, and pricing suggestions.

## Supported Backend Patterns

The dashboard is designed to work with backends built on:

- **LangChain** — callback-based tracing with model/token events
- **LangGraph** — node-level execution metadata with run/thread IDs
- **Custom agent frameworks** — any system that logs model calls with token counts and costs

## Required API Endpoints

Your backend must expose the following endpoints. All require Bearer token auth
(Supabase JWT) and admin role verification.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/role-check` | Returns `{ is_admin: boolean, email: string }` |

### Usage Data

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/usage/summary` | Today/week/month cost and call totals |
| GET | `/api/v1/admin/usage/logs?days=N&limit=N&offset=N` | Paginated usage log entries |
| GET | `/api/v1/admin/usage/by-model?days=N` | Cost aggregated by model |
| GET | `/api/v1/admin/usage/by-service?days=N` | Cost aggregated by service/workflow |
| GET | `/api/v1/admin/usage/by-meeting?days=N` | Cost aggregated by run/session |
| GET | `/api/v1/admin/usage/daily?days=N` | Daily cost time series |
| GET | `/api/v1/admin/usage/warnings` | Active cost/rate warnings |

### Pricing

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/pricing/suggest?avg_cost_per_meeting=N&avg_meetings_per_user=N&current_users=N` | AI-generated pricing recommendation |

## Telemetry Data Model

Each LLM call event should be logged with at minimum:

```typescript
interface LLMCallEvent {
  id: string;
  timestamp: string;        // ISO 8601
  model: string;            // e.g. "claude-sonnet-4-20250514", "gpt-4o-mini"
  service: string;          // logical workflow name (e.g. "detect_node", "brief_generation")
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;         // pre-calculated based on model pricing
  // Optional enrichment:
  node_name?: string;       // LangGraph node
  run_id?: string;          // LangGraph thread/run ID
  tenant_id?: string;       // multi-tenant scope
}
```

## How LangChain/LangGraph Apps Map Into This

### LangChain Callback Approach

Use a custom callback handler that fires on `on_llm_end`:

```python
class UsageTrackingCallback(BaseCallbackHandler):
    def on_llm_end(self, response, **kwargs):
        usage = response.llm_output.get("token_usage", {})
        log_usage(
            model=response.llm_output.get("model_name"),
            service=kwargs.get("tags", ["unknown"])[0],
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
        )
```

### LangGraph Node Approach

Instrument each node that calls an LLM:

```python
async def advise_node(state: AgentState) -> dict:
    result = await llm.ainvoke(messages)
    await usage_tracker.log(
        model="claude-sonnet-4-20250514",
        service="advise_node",
        prompt_tokens=result.usage_metadata["input_tokens"],
        completion_tokens=result.usage_metadata["output_tokens"],
        meeting_id=state.get("meeting_id"),
    )
    return {"advice": result.content}
```

## Meeting Whisperer: First Integration

Meeting Whisperer is the first concrete backend integration.
See [meeting-whisperer.md](./meeting-whisperer.md) for specifics.

Key mapping:
- "run" / "session" = a meeting session
- "service" = LangGraph node name (detect_node, retrieve_node, advise_node, etc.)
- Usage is tracked via `backend/app/services/usage_tracker.py` (fire-and-forget)
- Admin endpoints live in `backend/app/routers/admin.py`
- Admin role check uses `ADMIN_EMAILS` env var list

## Environment Setup

```bash
cp .env.local.example .env.local
# Edit with your Supabase credentials and backend API URL
pnpm install
pnpm dev
```

The dashboard runs on port 3006 by default to avoid conflicts with primary app frontends.
