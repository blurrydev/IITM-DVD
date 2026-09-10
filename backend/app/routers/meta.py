"""Health, filter options, and cache maintenance."""

import os

from fastapi import APIRouter, Header, HTTPException

from .. import analytics, data, schemas
from ..scope import clear_scope_cache

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health", response_model=schemas.Health)
def health():
    """Liveness plus a quick sanity check on how much data is loaded."""
    dataset = data.get_dataset()
    return {
        "status": "ok",
        "orders_loaded": int(len(dataset.orders)),
        "delivered_orders": int(len(dataset.delivered)),
        "tables_built_at": dataset.built_at.isoformat(),
        "served_from_cache": dataset.from_cache,
    }


@router.get("/filters", response_model=schemas.FilterOptions)
def filters():
    """Valid values for the dashboard filter controls."""
    return analytics.filter_options()


@router.post("/admin/refresh", response_model=schemas.Health)
def refresh(x_admin_token: str = Header(None)):
    """Rebuild the analysis tables from the CSVs (use after the dataset changes).

    Disabled unless an ADMIN_TOKEN is configured, so a deployed instance cannot be
    forced into an expensive rebuild by anyone who finds the URL.
    """
    expected = os.getenv("ADMIN_TOKEN")
    if not expected:
        raise HTTPException(status_code=403, detail="Refresh disabled: ADMIN_TOKEN is not set")
    if x_admin_token != expected:
        raise HTTPException(status_code=401, detail="Invalid admin token")

    dataset = data.rebuild_dataset()
    clear_scope_cache()
    return {
        "status": "rebuilt",
        "orders_loaded": int(len(dataset.orders)),
        "delivered_orders": int(len(dataset.delivered)),
        "tables_built_at": dataset.built_at.isoformat(),
        "served_from_cache": dataset.from_cache,
    }
