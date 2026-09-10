"""Seller endpoints -- the intervention list behind the risk quadrant."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from .. import analytics, schemas
from ..scope import Scope, scope_params

router = APIRouter(prefix="/api/sellers", tags=["sellers"])


@router.get("", response_model=schemas.SellerPage)
def list_sellers(
    scope: Scope = Depends(scope_params),
    min_orders: int = Query(10, ge=1, description="Minimum delivered orders per seller"),
    risk_tier: Optional[str] = Query(
        None, description="Filter by tier: Critical Risk | Watchlist | Healthy | Star Seller"
    ),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Sellers ranked by revenue, each tagged with an operational risk tier."""
    return analytics.seller_table(
        scope, min_orders=min_orders, risk_tier=risk_tier, limit=limit, offset=offset
    )


@router.get("/{seller_id}", response_model=schemas.SellerDetail)
def get_seller(seller_id: str, scope: Scope = Depends(scope_params)):
    """Drill-down for one seller: headline KPIs, monthly trend, top categories."""
    detail = analytics.seller_detail(scope, seller_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"No delivered orders for seller {seller_id}")
    return detail
