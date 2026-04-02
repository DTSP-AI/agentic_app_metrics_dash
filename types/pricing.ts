/**
 * Types for the pricing optimizer and revenue projection features.
 */

/** A pricing tier suggested by the AI. */
export interface PricingTier {
  name: string;
  price_per_seat: number;
  included_meetings: number;
  overage_rate: number;
  target: string;
}

/** Structured pricing suggestion from the backend. */
export interface PricingSuggestion {
  tiers?: PricingTier[];
  reasoning?: string;
  confidence?: string;
}

/** A single month in the 5-year revenue projection. */
export interface ProjectionMonth {
  month: number;
  label: string;
  users: number;
  seats: number;
  gross: number;
  llm_cost: number;
  infra: number;
  total_cost: number;
  net: number;
  margin: number;
}

/** Yearly aggregation of projections. */
export interface ProjectionYear {
  year: string;
  users: number;
  seats: number;
  gross: number;
  llm_cost: number;
  infra: number;
  total_cost: number;
  net: number;
  margin: number;
}
