"""Supporting analysis endpoints used by the secondary dashboard views."""

from fastapi import APIRouter, Depends, Query

from .. import analytics, schemas
from ..scope import Scope, scope_params

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/categories", response_model=list[schemas.CategoryRow])
def get_categories(
    scope: Scope = Depends(scope_params),
    min_items: int = Query(100, ge=1, description="Volume floor per category"),
    limit: int = Query(35, ge=1, le=100),
):
    """Category scorecard: volume, GMV, freight burden, CSAT and quadrant label."""
    return analytics.category_risk(scope, min_items=min_items, limit=limit)


@router.get("/monthly-trend", response_model=list[schemas.MonthlyTrendRow])
def get_monthly_trend(scope: Scope = Depends(scope_params)):
    """Growth vs satisfaction month by month -- the trade-off leadership manages."""
    return analytics.monthly_trend(scope)


@router.get("/marketing-funnel", response_model=schemas.MarketingFunnel)
def get_marketing_funnel():
    """Seller acquisition mix, joined to the marketplace quality each channel produced."""
    return analytics.marketing_funnel()
