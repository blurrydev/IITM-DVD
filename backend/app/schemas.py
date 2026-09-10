"""Response models.

These give the API a typed contract (and a self-documenting /docs page) that mirrors
the TypeScript interfaces in the dashboard components.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class Health(BaseModel):
    status: str
    orders_loaded: int
    delivered_orders: int
    tables_built_at: str
    served_from_cache: bool


class FilterState(BaseModel):
    state: Optional[str] = None
    region: Optional[str] = None
    category: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class DateRange(BaseModel):
    min: str
    max: str


class FilterOptions(BaseModel):
    states: list[str]
    regions: list[str]
    categories: list[str]
    date_range: DateRange


class Kpis(BaseModel):
    total_orders: int
    delivered_orders: int
    overall_avg_score: float
    late_rate_pct: float
    avg_delivery_days: float
    avg_carrier_transit: float
    avg_seller_handling: float
    on_time_avg_score: float
    late_avg_score: float
    score_gap: float = Field(description="On-time average score minus late average score")
    one_star_pct: float
    five_star_pct: float
    top_10pct_seller_rev_share: float
    top_1pct_seller_rev_share: float


class SatisfactionCliffBucket(BaseModel):
    bucket: str
    avg_score: float
    one_star_pct: float
    five_star_pct: float
    order_count: int


class RootCauseBucket(BaseModel):
    delay_bucket: str
    seller_handling_score: float
    carrier_transit_score: float
    seller_count: int
    carrier_count: int


class LogisticsComplexityBucket(BaseModel):
    sellers_category: str
    avg_review_score: float
    order_count: int
    one_star_pct: float


class SellerPoint(BaseModel):
    seller_id: str = Field(description="Truncated id for chart labels")
    full_seller_id: str
    revenue: float
    avg_review_score: float
    orders: int
    late_rate: float
    state: str
    in_pareto_80: bool
    is_top_risk: bool
    rank: int


class SellerRiskQuadrant(BaseModel):
    platform_avg_revenue: float
    platform_avg_score: float
    score_p25_cutoff: float
    sellers: list[SellerPoint]


class OrderSplittingCell(BaseModel):
    sellers_cat: str
    sellers_x: int
    items_cat: str
    items_y: int
    order_count: int
    total_revenue: float
    avg_review_score: float


class RegionalPerformanceRow(BaseModel):
    state: str
    region: str
    order_count: int
    avg_delivery_days: float
    late_rate_pct: float
    avg_review_score: float


class ParallelCoordinatesMeta(BaseModel):
    approval_lag_max: float
    seller_handling_max: float
    carrier_transit_max: float


class ParallelCoordinatesSample(BaseModel):
    order_id: str
    approval_lag_hours: float
    seller_handling_days: float
    carrier_transit_days: float
    review_score: int


class ParallelCoordinates(BaseModel):
    meta: ParallelCoordinatesMeta
    samples: list[ParallelCoordinatesSample]


class HexbinCell(BaseModel):
    lat: float
    lng: float
    order_count: int
    median_carrier_transit: float
    avg_review_score: float
    state: str


class SentimentSubcategory(BaseModel):
    name: str
    weight: int
    sample_keywords: list[str]


class SentimentTopic(BaseModel):
    name: str
    value: int
    color: str
    subcategories: list[SentimentSubcategory]


class Dashboard(BaseModel):
    """Everything the dashboard page needs in a single round trip."""

    filters: FilterState
    kpis: Kpis
    satisfaction_cliff: list[SatisfactionCliffBucket]
    root_cause_analysis: list[RootCauseBucket]
    seller_risk_quadrant: SellerRiskQuadrant
    logistics_complexity: list[LogisticsComplexityBucket]
    regional_performance: list[RegionalPerformanceRow]
    parallel_coordinates: ParallelCoordinates
    order_splitting_matrix: list[OrderSplittingCell]
    hexbin_map: list[HexbinCell]
    sentiment_treemap: list[SentimentTopic]


class SellerRow(BaseModel):
    seller_id: str
    state: str
    orders: int
    revenue: float
    avg_review_score: float
    late_rate: float
    avg_delivery_days: float
    cum_rev_pct: float
    in_pareto_80: bool
    risk_tier: str
    rank: int


class SellerPage(BaseModel):
    total: int
    limit: int
    offset: int
    sellers: list[SellerRow]


class SellerMonth(BaseModel):
    month: str
    orders: int
    revenue: float
    avg_review_score: float
    late_rate: float


class SellerCategory(BaseModel):
    category: str
    items: int
    revenue: float
    avg_review_score: float


class SellerDetail(BaseModel):
    seller_id: str
    state: str
    orders: int
    items: int
    revenue: float
    avg_review_score: float
    one_star_pct: float
    late_rate: float
    avg_delivery_days: float
    risk_tier: str
    monthly: list[SellerMonth]
    top_categories: list[SellerCategory]


class CategoryRow(BaseModel):
    category: str
    total_items: int
    total_gmv: float
    avg_price: float
    avg_freight: float
    freight_ratio_pct: float
    avg_weight_kg: float
    avg_score: float
    late_pct: float
    one_star_pct: float
    quadrant: str


class MonthlyTrendRow(BaseModel):
    month: str
    orders: int
    gmv: float
    avg_score: float
    on_time_pct: float
    late_rate_pct: float
    avg_delivery_days: float


class FunnelOrigin(BaseModel):
    origin: str
    closed_deals: int
    active_sellers: int
    declared_revenue: float
    marketplace_revenue: float
    avg_review_score: float


class FunnelSegment(BaseModel):
    segment: str
    seller_count: int
    avg_declared_revenue: float
    avg_review_score: float


class MarketingFunnel(BaseModel):
    total_leads: int
    converted_sellers: int
    by_origin: list[FunnelOrigin]
    by_segment: list[FunnelSegment]
