/**
 * Dashboard API client.
 *
 * Connects directly to the FastAPI backend running on port 8000.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type DashboardFilters = {
  state?: string;
  region?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
};

export type Kpis = {
  total_orders: number;
  delivered_orders: number;
  overall_avg_score: number;
  late_rate_pct: number;
  avg_delivery_days: number;
  avg_carrier_transit: number;
  avg_seller_handling: number;
  on_time_avg_score: number;
  late_avg_score: number;
  score_gap: number;
  one_star_pct: number;
  five_star_pct: number;
  top_10pct_seller_rev_share: number;
  top_1pct_seller_rev_share: number;
};

export type SatisfactionCliffBucket = {
  bucket: string;
  avg_score: number;
  one_star_pct: number;
  five_star_pct: number;
  order_count: number;
};

export type RootCauseBucket = {
  delay_bucket: string;
  seller_handling_score: number;
  carrier_transit_score: number;
  seller_count: number;
  carrier_count: number;
};

export type LogisticsComplexityBucket = {
  sellers_category: string;
  avg_review_score: number;
  order_count: number;
  one_star_pct: number;
};

export type SellerPoint = {
  seller_id: string;
  full_seller_id: string;
  revenue: number;
  avg_review_score: number;
  orders: number;
  late_rate: number;
  state: string;
  in_pareto_80: boolean;
  is_top_risk: boolean;
  rank: number;
};

export type SellerRiskQuadrant = {
  platform_avg_revenue: number;
  platform_avg_score: number;
  score_p25_cutoff: number;
  sellers: SellerPoint[];
};

export type OrderSplittingCell = {
  sellers_cat: string;
  sellers_x: number;
  items_cat: string;
  items_y: number;
  order_count: number;
  total_revenue: number;
  avg_review_score: number;
};

export type RegionalPerformanceRow = {
  state: string;
  region: string;
  order_count: number;
  avg_delivery_days: number;
  late_rate_pct: number;
  avg_review_score: number;
};

export type ParallelCoordinatesMeta = {
  approval_lag_max: number;
  seller_handling_max: number;
  carrier_transit_max: number;
};

export type ParallelCoordinatesSample = {
  order_id: string;
  approval_lag_hours: number;
  seller_handling_days: number;
  carrier_transit_days: number;
  review_score: number;
};

export type ParallelCoordinates = {
  meta: ParallelCoordinatesMeta;
  samples: ParallelCoordinatesSample[];
};

export type HexbinCell = {
  lat: number;
  lng: number;
  order_count: number;
  median_carrier_transit: number;
  avg_review_score: number;
  state: string;
};

export type SentimentSubcategory = {
  name: string;
  weight: number;
  sample_keywords: string[];
};

export type SentimentTopic = {
  name: string;
  value: number;
  color: string;
  subcategories: SentimentSubcategory[];
};

export type DashboardData = {
  filters: {
    state?: string;
    region?: string;
    category?: string;
    date_from?: string;
    date_to?: string;
  };
  kpis: Kpis;
  satisfaction_cliff: SatisfactionCliffBucket[];
  root_cause_analysis: RootCauseBucket[];
  seller_risk_quadrant: SellerRiskQuadrant;
  logistics_complexity: LogisticsComplexityBucket[];
  regional_performance: RegionalPerformanceRow[];
  parallel_coordinates: ParallelCoordinates;
  order_splitting_matrix: OrderSplittingCell[];
  hexbin_map: HexbinCell[];
  sentiment_treemap: SentimentTopic[];
};

export type FilterOptions = {
  states: string[];
  regions: string[];
  categories: string[];
  date_range: { min: string; max: string };
};

export type SellerRow = {
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
};

export type SellerPage = {
  total: number;
  limit: number;
  offset: number;
  sellers: SellerRow[];
};

export type SellerDetail = {
  seller_id: string;
  state: string;
  orders: number;
  items: number;
  revenue: number;
  avg_review_score: number;
  one_star_pct: number;
  late_rate: number;
  avg_delivery_days: number;
  risk_tier: string;
  monthly: Array<{
    month: string;
    orders: number;
    revenue: number;
    avg_review_score: number;
    late_rate: number;
  }>;
  top_categories: Array<{
    category: string;
    items: number;
    revenue: number;
    avg_review_score: number;
  }>;
};

export type CategoryRow = {
  category: string;
  total_items: number;
  total_gmv: number;
  avg_price: number;
  avg_freight: number;
  freight_ratio_pct: number;
  avg_weight_kg: number;
  avg_score: number;
  late_pct: number;
  one_star_pct: number;
  quadrant: string;
};

export type MonthlyTrendRow = {
  month: string;
  orders: number;
  gmv: number;
  avg_score: number;
  on_time_pct: number;
  late_rate_pct: number;
  avg_delivery_days: number;
};

export type FunnelOrigin = {
  origin: string;
  closed_deals: number;
  active_sellers: number;
  declared_revenue: number;
  marketplace_revenue: number;
  avg_review_score: number;
};

export type FunnelSegment = {
  segment: string;
  seller_count: number;
  avg_declared_revenue: number;
  avg_review_score: number;
};

export type MarketingFunnelData = {
  total_leads: number;
  converted_sellers: number;
  by_origin: FunnelOrigin[];
  by_segment: FunnelSegment[];
};

function buildUrl(path: string, filters: Record<string, any> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return `${API_URL}${path}${query ? `?${query}` : ""}`;
}

async function getJson<T>(path: string, filters: Record<string, any> = {}): Promise<T> {
  const response = await fetch(buildUrl(path, filters), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/** Full executive dashboard payload from FastAPI. */
export async function fetchDashboard(filters: DashboardFilters = {}): Promise<DashboardData> {
  return getJson<DashboardData>("/api/dashboard", filters);
}

/** Filter control options (states, regions, categories, date range). */
export async function fetchFilterOptions(): Promise<FilterOptions> {
  return getJson<FilterOptions>("/api/filters");
}

/** Executive KPIs. */
export async function fetchKpis(filters: DashboardFilters = {}): Promise<Kpis> {
  return getJson<Kpis>("/api/kpis", filters);
}

/** Seller intervention list, optionally narrowed to one risk tier. */
export async function fetchSellers(
  filters: DashboardFilters & { risk_tier?: string; limit?: number; offset?: number } = {},
): Promise<SellerPage> {
  return getJson<SellerPage>("/api/sellers", filters);
}

/** Single seller detail drill-down. */
export async function fetchSellerDetail(
  sellerId: string,
  filters: DashboardFilters = {},
): Promise<SellerDetail> {
  return getJson<SellerDetail>(`/api/sellers/${encodeURIComponent(sellerId)}`, filters);
}

/** Category risk scorecard. */
export async function fetchCategoryScorecard(
  filters: DashboardFilters & { min_items?: number; limit?: number } = {},
): Promise<CategoryRow[]> {
  return getJson<CategoryRow[]>("/api/insights/categories", filters);
}

/** Monthly growth vs CSAT trend. */
export async function fetchMonthlyTrend(filters: DashboardFilters = {}): Promise<MonthlyTrendRow[]> {
  return getJson<MonthlyTrendRow[]>("/api/insights/monthly-trend", filters);
}

/** Marketing & acquisition funnel data. */
export async function fetchMarketingFunnel(): Promise<MarketingFunnelData> {
  return getJson<MarketingFunnelData>("/api/insights/marketing-funnel");
}

/** Single visual endpoints for dynamic component-level refresh. */
export const fetchVisual = {
  satisfactionCliff: (f: DashboardFilters = {}) =>
    getJson<SatisfactionCliffBucket[]>("/api/visuals/satisfaction-cliff", f),
  rootCause: (f: DashboardFilters = {}) =>
    getJson<RootCauseBucket[]>("/api/visuals/root-cause", f),
  sellerRiskQuadrant: (f: DashboardFilters = {}) =>
    getJson<SellerRiskQuadrant>("/api/visuals/seller-risk-quadrant", f),
  logisticsComplexity: (f: DashboardFilters = {}) =>
    getJson<LogisticsComplexityBucket[]>("/api/visuals/logistics-complexity", f),
  regionalPerformance: (f: DashboardFilters = {}) =>
    getJson<RegionalPerformanceRow[]>("/api/visuals/regional-performance", f),
  parallelCoordinates: (f: DashboardFilters = {}) =>
    getJson<ParallelCoordinates>("/api/visuals/parallel-coordinates", f),
  orderSplittingMatrix: (f: DashboardFilters = {}) =>
    getJson<OrderSplittingCell[]>("/api/visuals/order-splitting-matrix", f),
  hexbinMap: (f: DashboardFilters = {}) =>
    getJson<HexbinCell[]>("/api/visuals/hexbin-map", f),
  sentimentTreemap: (f: DashboardFilters = {}) =>
    getJson<SentimentTopic[]>("/api/visuals/sentiment-treemap", f),
};
