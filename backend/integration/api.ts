/**
 * Dashboard API client.
 *
 * Copy to `dvd-project-main/src/lib/api.ts` and set NEXT_PUBLIC_API_URL.
 *
 * The payload keys are identical to `src/data/team_analytics_data.json`, so the
 * existing chart components need no changes. If the API is unreachable we fall back
 * to the bundled JSON, which keeps the deployed build working without a backend.
 */

import staticData from "@/data/team_analytics_data.json";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type DashboardFilters = {
  state?: string;
  region?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
};

export type DashboardData = typeof staticData;

function buildUrl(path: string, filters: DashboardFilters = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `${API_URL}${path}${query ? `?${query}` : ""}`;
}

async function getJson<T>(path: string, filters: DashboardFilters = {}): Promise<T> {
  const response = await fetch(buildUrl(path, filters), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/** Full dashboard payload; falls back to the bundled snapshot on any failure. */
export async function fetchDashboard(filters: DashboardFilters = {}): Promise<DashboardData> {
  try {
    return await getJson<DashboardData>("/api/dashboard", filters);
  } catch (error) {
    console.warn("Live API unavailable, using bundled dataset.", error);
    return staticData as DashboardData;
  }
}

/** Values for the filter controls (states, regions, categories, date range). */
export async function fetchFilterOptions() {
  return getJson<{
    states: string[];
    regions: string[];
    categories: string[];
    date_range: { min: string; max: string };
  }>("/api/filters");
}

/** Seller intervention list, optionally narrowed to one risk tier. */
export async function fetchSellers(
  filters: DashboardFilters & { risk_tier?: string; limit?: number; offset?: number } = {},
) {
  return getJson<{
    total: number;
    limit: number;
    offset: number;
    sellers: Array<{
      seller_id: string;
      state: string;
      orders: number;
      revenue: number;
      avg_review_score: number;
      late_rate: number;
      avg_delivery_days: number;
      cum_rev_pct: number;
      in_pareto_80: boolean;
      risk_tier: string;
      rank: number;
    }>;
  }>("/api/sellers", filters as DashboardFilters);
}

/** Single visual, for views that refresh independently of the rest of the page. */
export const fetchVisual = {
  satisfactionCliff: (f: DashboardFilters = {}) =>
    getJson<DashboardData["satisfaction_cliff"]>("/api/visuals/satisfaction-cliff", f),
  rootCause: (f: DashboardFilters = {}) =>
    getJson<DashboardData["root_cause_analysis"]>("/api/visuals/root-cause", f),
  sellerRiskQuadrant: (f: DashboardFilters = {}) =>
    getJson<DashboardData["seller_risk_quadrant"]>("/api/visuals/seller-risk-quadrant", f),
  logisticsComplexity: (f: DashboardFilters = {}) =>
    getJson<DashboardData["logistics_complexity"]>("/api/visuals/logistics-complexity", f),
  regionalPerformance: (f: DashboardFilters = {}) =>
    getJson<DashboardData["regional_performance"]>("/api/visuals/regional-performance", f),
  parallelCoordinates: (f: DashboardFilters = {}) =>
    getJson<DashboardData["parallel_coordinates"]>("/api/visuals/parallel-coordinates", f),
  orderSplittingMatrix: (f: DashboardFilters = {}) =>
    getJson<DashboardData["order_splitting_matrix"]>("/api/visuals/order-splitting-matrix", f),
  hexbinMap: (f: DashboardFilters = {}) =>
    getJson<DashboardData["hexbin_map"]>("/api/visuals/hexbin-map", f),
  sentimentTreemap: (f: DashboardFilters = {}) =>
    getJson<DashboardData["sentiment_treemap"]>("/api/visuals/sentiment-treemap", f),
};
