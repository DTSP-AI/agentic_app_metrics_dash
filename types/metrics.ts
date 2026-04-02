/**
 * Normalized telemetry types for agent observability dashboards.
 *
 * These types describe the shape of data that any LLM-powered backend
 * should expose to feed the dashboard. Meeting Whisperer is the first
 * concrete implementation, but any LangChain/LangGraph app can map
 * its traces into these structures.
 */

/** A single LLM invocation event. */
export interface LLMCallEvent {
  id: string;
  timestamp: string;
  /** Model identifier (e.g. "claude-sonnet-4-20250514", "gpt-4o-mini") */
  model: string;
  /** Logical service or workflow that triggered the call */
  service: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  /** Optional: LangGraph node name */
  node_name?: string;
  /** Optional: LangGraph run/thread ID */
  run_id?: string;
  /** Optional: tenant or user scope */
  tenant_id?: string;
  metadata?: Record<string, unknown>;
}

/** Aggregated cost by model over a time range. */
export interface ModelCostSummary {
  model: string;
  total_cost: number;
  total_calls: number;
  avg_cost_per_call: number;
}

/** Aggregated cost by service/workflow over a time range. */
export interface ServiceCostSummary {
  service: string;
  total_cost: number;
  total_calls: number;
}

/** Cost for a single run/session/meeting. */
export interface RunCostSummary {
  run_id: string;
  total_cost: number;
  call_count: number;
  /** Optional: human-readable label */
  label?: string;
}

/** Daily cost time series point. */
export interface DailyCostPoint {
  date: string; // ISO date (YYYY-MM-DD)
  total_cost: number;
  total_calls: number;
}

/** Usage summary across multiple time windows. */
export interface UsageSnapshot {
  today_cost: number;
  today_calls: number;
  week_cost: number;
  week_calls: number;
  month_cost: number;
  month_calls: number;
}

/** A cost/usage warning from the backend. */
export interface CostWarning {
  level: 'warning' | 'critical';
  message: string;
}
