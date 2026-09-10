"""Dashboard endpoints -- the executive KPI strip and the 10 core visuals.

Every route accepts the shared filters (state, region, category, date_from, date_to)
via the `scope_params` dependency.
"""

from fastapi import APIRouter, Depends, Query

from .. import analytics, schemas
from ..scope import Scope, scope_params

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard", response_model=schemas.Dashboard)
def get_dashboard(scope: Scope = Depends(scope_params)):
    """Whole dashboard in one call (drop-in for the static team_analytics_data.json)."""
    return analytics.dashboard_payload(scope)


@router.get("/kpis", response_model=schemas.Kpis)
def get_kpis(scope: Scope = Depends(scope_params)):
    """Executive KPI strip: volume, CSAT, the late-vs-on-time gap, lead times."""
    return analytics.kpis(scope)


@router.get("/visuals/satisfaction-cliff", response_model=list[schemas.SatisfactionCliffBucket])
def get_satisfaction_cliff(scope: Scope = Depends(scope_params)):
    """Visual 1 -- review score by delivery lead-time tier."""
    return analytics.satisfaction_cliff(scope)


@router.get("/visuals/root-cause", response_model=list[schemas.RootCauseBucket])
def get_root_cause(scope: Scope = Depends(scope_params)):
    """Visual 2 -- seller handling vs carrier transit at equal delay lengths."""
    return analytics.root_cause_analysis(scope)


@router.get(
    "/visuals/logistics-complexity", response_model=list[schemas.LogisticsComplexityBucket]
)
def get_logistics_complexity(scope: Scope = Depends(scope_params)):
    """Visual 4 -- satisfaction by number of sellers in the order."""
    return analytics.logistics_complexity(scope)


@router.get("/visuals/seller-risk-quadrant", response_model=schemas.SellerRiskQuadrant)
def get_seller_risk_quadrant(
    scope: Scope = Depends(scope_params),
    min_orders: int = Query(10, ge=1, description="Minimum delivered orders per seller"),
    limit: int = Query(250, ge=1, le=2000, description="Highest-revenue sellers to plot"),
):
    """Visuals 3 & 9 -- revenue vs CSAT quadrants with Pareto and top-5 risk flags."""
    return analytics.seller_risk_quadrant(scope, min_orders=min_orders, limit=limit)


@router.get("/visuals/order-splitting-matrix", response_model=list[schemas.OrderSplittingCell])
def get_order_splitting_matrix(scope: Scope = Depends(scope_params)):
    """Visual 7 -- sellers x items bubble matrix sized by revenue."""
    return analytics.order_splitting_matrix(scope)


@router.get("/visuals/regional-performance", response_model=list[schemas.RegionalPerformanceRow])
def get_regional_performance(
    scope: Scope = Depends(scope_params),
    min_orders: int = Query(300, ge=1, description="Volume floor per state"),
):
    """Visual 5 -- delivery days and late rate by customer state."""
    return analytics.regional_performance(scope, min_orders=min_orders)


@router.get("/visuals/parallel-coordinates", response_model=schemas.ParallelCoordinates)
def get_parallel_coordinates(
    scope: Scope = Depends(scope_params),
    per_score: int = Query(30, ge=1, le=200, description="Sampled orders per star rating"),
):
    """Visual 6 -- approval lag / handling / transit paths by star rating."""
    return analytics.parallel_coordinates(scope, per_score=per_score)


@router.get("/visuals/hexbin-map", response_model=list[schemas.HexbinCell])
def get_hexbin_map(
    scope: Scope = Depends(scope_params),
    min_orders: int = Query(15, ge=1, description="Volume floor per map cell"),
):
    """Visual 8 -- geographic bins coloured by median carrier transit time."""
    return analytics.hexbin_map(scope, min_orders=min_orders)


@router.get("/visuals/sentiment-treemap", response_model=list[schemas.SentimentTopic])
def get_sentiment_treemap(scope: Scope = Depends(scope_params)):
    """Visual 10 -- review comments classified into themes and sub-themes."""
    return analytics.sentiment_treemap(scope)
