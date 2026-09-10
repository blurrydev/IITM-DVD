"""Dashboard filters.

Every visual endpoint accepts the same optional filters (state, region, category,
purchase date range). `Scope` applies them once and hands the analytics functions a
consistent set of pre-filtered tables, so a filtered dashboard stays internally
consistent: the seller scatter, the map and the KPI strip all describe the same orders.

Scopes are memoised because the dashboard fires ~10 requests per filter change.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from functools import lru_cache
from typing import Optional

import pandas as pd
from fastapi import Query

from .data import get_dataset


@dataclass(frozen=True)
class Filters:
    """Hashable filter set (frozen so it can key the scope cache)."""

    state: Optional[str] = None
    region: Optional[str] = None
    category: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None

    @property
    def is_empty(self) -> bool:
        return not any([self.state, self.region, self.category, self.date_from, self.date_to])

    def as_dict(self) -> dict:
        return {
            "state": self.state,
            "region": self.region,
            "category": self.category,
            "date_from": self.date_from.isoformat() if self.date_from else None,
            "date_to": self.date_to.isoformat() if self.date_to else None,
        }


class Scope:
    """The filtered slice of the marketplace an endpoint should describe.

    Attributes:
        all_orders:    filtered orders, every status (denominator for volume KPIs)
        orders:        filtered delivered orders (the CSAT / delivery population)
        order_sellers: (order, seller) rows for those delivered orders
        items:         order items for those delivered orders
        reviews:       review comments for those delivered orders
    """

    def __init__(self, filters: Filters):
        dataset = get_dataset()
        self.filters = filters
        self.all_orders = _filter_orders(dataset.orders, filters)
        self.orders = self.all_orders[self.all_orders["order_status"] == "delivered"]

        order_ids = self.orders["order_id"]
        if filters.is_empty:
            self.order_sellers = dataset.order_sellers
            self.items = dataset.items
            self.reviews = dataset.reviews
        else:
            keys = set(order_ids)
            self.order_sellers = dataset.order_sellers[
                dataset.order_sellers["order_id"].isin(keys)
            ]
            self.items = dataset.items[dataset.items["order_id"].isin(keys)]
            self.reviews = dataset.reviews[dataset.reviews["order_id"].isin(keys)]

    @property
    def is_empty(self) -> bool:
        """True when the filter combination matched no delivered orders."""
        return self.orders.empty


def _filter_orders(orders: pd.DataFrame, filters: Filters) -> pd.DataFrame:
    if filters.is_empty:
        return orders

    mask = pd.Series(True, index=orders.index)
    if filters.state:
        mask &= orders["customer_state"].str.upper() == filters.state.upper()
    if filters.region:
        mask &= orders["customer_region"].str.lower() == filters.region.lower()
    if filters.category:
        mask &= orders["primary_category"].str.lower() == filters.category.lower()
    if filters.date_from:
        mask &= orders["purchase_date"] >= filters.date_from
    if filters.date_to:
        mask &= orders["purchase_date"] <= filters.date_to
    return orders[mask]


@lru_cache(maxsize=64)
def _cached_scope(filters: Filters) -> Scope:
    return Scope(filters)


def clear_scope_cache() -> None:
    _cached_scope.cache_clear()


def scope_params(
    state: Optional[str] = Query(
        None, description="Customer state code, e.g. SP", max_length=2, min_length=2
    ),
    region: Optional[str] = Query(
        None, description="Customer region, e.g. Northeast", max_length=20
    ),
    category: Optional[str] = Query(
        None, description="Product category (English, title case), e.g. Bed Bath Table"
    ),
    date_from: Optional[date] = Query(None, description="Earliest purchase date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Latest purchase date (YYYY-MM-DD)"),
) -> Scope:
    """FastAPI dependency: turn query params into a memoised `Scope`."""
    return _cached_scope(Filters(state, region, category, date_from, date_to))
