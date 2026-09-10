"""Data loading and enrichment.

The raw dataset is 9 relational CSVs (~120 MB). Reading and joining them on every
request would be far too slow, so we build the analysis tables once, keep them in
memory, and pickle them to `backend/cache/` so restarts are near-instant.

Tables built here:
    orders        one row per order, enriched with lead times, lateness, review
                  score, customer geography and basket shape
    order_sellers one row per (order, seller) pair -- the grain used for seller KPIs
    items         one row per order item, enriched with category and order outcome
    reviews       one row per review comment, lowercased for text mining
    funnel        marketing qualified leads joined to closed deals
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import pandas as pd

from . import config

log = logging.getLogger(__name__)

# Bump when the enrichment logic changes so stale caches are rebuilt.
CACHE_VERSION = 1

TABLE_NAMES = ("orders", "order_sellers", "items", "reviews", "funnel")

# Brazil bounding box, used to drop clearly corrupt geolocation rows.
LAT_MIN, LAT_MAX = -34.0, 5.5
LNG_MIN, LNG_MAX = -74.0, -34.0

REGION_BY_STATE = {
    "SP": "Southeast", "RJ": "Southeast", "MG": "Southeast", "ES": "Southeast",
    "PR": "South", "SC": "South", "RS": "South",
    "DF": "Central-West", "GO": "Central-West", "MT": "Central-West", "MS": "Central-West",
    "BA": "Northeast", "PE": "Northeast", "CE": "Northeast", "MA": "Northeast",
    "PB": "Northeast", "RN": "Northeast", "AL": "Northeast", "PI": "Northeast", "SE": "Northeast",
    "AM": "North", "PA": "North", "RO": "North", "TO": "North", "AC": "North",
    "AP": "North", "RR": "North",
}


@dataclass
class Dataset:
    """In-memory analysis tables shared by every endpoint."""

    orders: pd.DataFrame
    order_sellers: pd.DataFrame
    items: pd.DataFrame
    reviews: pd.DataFrame
    funnel: pd.DataFrame
    built_at: datetime
    from_cache: bool

    @property
    def delivered(self) -> pd.DataFrame:
        """Delivered orders only -- the population for every delivery/CSAT visual."""
        return self.orders[self.orders["order_status"] == "delivered"]


_dataset: Optional[Dataset] = None


def get_dataset() -> Dataset:
    """Return the shared dataset, building or loading it on first use."""
    global _dataset
    if _dataset is None:
        _dataset = _load_dataset()
    return _dataset


def _load_dataset() -> Dataset:
    cached = _read_cache()
    if cached is not None:
        log.info("Loaded analysis tables from cache: %s", config.CACHE_DIR)
        return cached

    started = time.perf_counter()
    log.info("Building analysis tables from CSVs in %s ...", config.DATA_DIR)
    tables = _build_tables()
    log.info("Built analysis tables in %.1fs", time.perf_counter() - started)

    _write_cache(tables)
    return Dataset(built_at=datetime.now(timezone.utc), from_cache=False, **tables)


# ----------------------------------------------------------------------------
# Cache helpers
# ----------------------------------------------------------------------------

def _cache_meta_path():
    return config.CACHE_DIR / "meta.json"


def _read_cache() -> Optional[Dataset]:
    meta_path = _cache_meta_path()
    if not meta_path.exists():
        return None
    try:
        meta = json.loads(meta_path.read_text())
        if meta.get("cache_version") != CACHE_VERSION:
            return None
        tables = {
            name: pd.read_pickle(config.CACHE_DIR / f"{name}.pkl") for name in TABLE_NAMES
        }
    except Exception as exc:  # corrupt or partial cache -- just rebuild
        log.warning("Ignoring unreadable cache in %s due to error: %s", config.CACHE_DIR, exc)
        return None
    return Dataset(
        built_at=datetime.fromisoformat(meta["built_at"]), from_cache=True, **tables
    )


def _write_cache(tables: dict[str, pd.DataFrame]) -> None:
    try:
        config.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        for name, frame in tables.items():
            frame.to_pickle(config.CACHE_DIR / f"{name}.pkl")
        _cache_meta_path().write_text(
            json.dumps(
                {
                    "cache_version": CACHE_VERSION,
                    "built_at": datetime.now(timezone.utc).isoformat(),
                    "row_counts": {name: len(frame) for name, frame in tables.items()},
                },
                indent=2,
            )
        )
    except OSError:
        # A read-only deployment is fine -- we just rebuild on every boot.
        log.warning("Could not write cache to %s", config.CACHE_DIR, exc_info=True)


def rebuild_dataset() -> Dataset:
    """Force a rebuild from the CSVs, replacing the in-memory tables and cache."""
    global _dataset
    tables = _build_tables()
    _write_cache(tables)
    _dataset = Dataset(built_at=datetime.now(timezone.utc), from_cache=False, **tables)
    return _dataset


# ----------------------------------------------------------------------------
# Enrichment
# ----------------------------------------------------------------------------

def _csv(directory, name: str, **kwargs) -> pd.DataFrame:
    path = directory / name
    if not path.exists():
        raise FileNotFoundError(f"Missing dataset file: {path}")
    return pd.read_csv(path, **kwargs)


def _build_tables() -> dict[str, pd.DataFrame]:
    ecom = config.ecommerce_dir()
    funnel_path = config.funnel_dir()

    orders_raw = _csv(ecom, "orders_dataset.csv")
    items_raw = _csv(ecom, "order_items_dataset.csv")
    products = _csv(ecom, "products_dataset.csv")
    sellers = _csv(ecom, "sellers_dataset.csv")
    customers = _csv(ecom, "customers_dataset.csv")
    reviews_raw = _csv(ecom, "order_reviews_dataset.csv")
    translation = _csv(ecom, "product_category_name_translation.csv", encoding="utf-8-sig")

    items = _build_items(items_raw, products, sellers, translation)
    order_basket = _build_order_basket(items)
    orders = _build_orders(orders_raw, reviews_raw, customers, order_basket, ecom)

    # Attach the order outcome to the item / (order, seller) grains so seller and
    # category KPIs can be computed without re-joining on every request.
    outcome_cols = ["order_id", "review_score", "is_late", "delivery_days", "purchase_month"]
    outcome = orders.loc[orders["order_status"] == "delivered", outcome_cols]

    items = items.merge(outcome, on="order_id", how="inner")
    order_sellers = _build_order_sellers(items)

    return {
        "orders": orders,
        "order_sellers": order_sellers,
        "items": items,
        "reviews": _build_reviews(reviews_raw),
        "funnel": _build_funnel(funnel_path),
    }


def _build_items(
    items_raw: pd.DataFrame,
    products: pd.DataFrame,
    sellers: pd.DataFrame,
    translation: pd.DataFrame,
) -> pd.DataFrame:
    category_map = dict(
        zip(translation["product_category_name"], translation["product_category_name_english"])
    )
    products = products.copy()
    products["category"] = (
        products["product_category_name"]
        .map(category_map)
        .fillna("others")
        .str.replace("_", " ")
        .str.title()
    )

    items = items_raw.merge(
        products[["product_id", "category", "product_weight_g"]], on="product_id", how="left"
    ).merge(sellers[["seller_id", "seller_state", "seller_city"]], on="seller_id", how="left")

    items["category"] = items["category"].fillna("Others")
    items["item_revenue"] = items["price"] + items["freight_value"]
    return items


def _build_order_basket(items: pd.DataFrame) -> pd.DataFrame:
    """Basket shape per order: size, how many sellers it was split across, value."""
    basket = items.groupby("order_id").agg(
        n_items=("order_item_id", "count"),
        n_sellers=("seller_id", "nunique"),
        total_price=("price", "sum"),
        total_freight=("freight_value", "sum"),
    )
    basket["total_value"] = basket["total_price"] + basket["total_freight"]

    # Primary seller / category = the highest-value item in the order. Deterministic
    # and a fair label for split orders.
    primary = (
        items.sort_values(["order_id", "price"], ascending=[True, False])
        .drop_duplicates("order_id")
        .set_index("order_id")[["seller_id", "seller_state", "category"]]
        .rename(
            columns={
                "seller_id": "primary_seller_id",
                "seller_state": "primary_seller_state",
                "category": "primary_category",
            }
        )
    )
    return basket.join(primary).reset_index()


def _build_orders(
    orders_raw: pd.DataFrame,
    reviews_raw: pd.DataFrame,
    customers: pd.DataFrame,
    basket: pd.DataFrame,
    ecom_dir,
) -> pd.DataFrame:
    orders = orders_raw.copy()
    date_cols = [
        "order_purchase_timestamp",
        "order_approved_at",
        "order_delivered_carrier_date",
        "order_delivered_customer_date",
        "order_estimated_delivery_date",
    ]
    for col in date_cols:
        orders[col] = pd.to_datetime(orders[col], errors="coerce")

    orders["purchase_date"] = orders["order_purchase_timestamp"].dt.date
    orders["purchase_month"] = orders["order_purchase_timestamp"].dt.to_period("M").astype(str)

    hours = lambda delta: delta.dt.total_seconds() / 3600.0  # noqa: E731
    days = lambda delta: delta.dt.total_seconds() / 86400.0  # noqa: E731

    # The four stages of the order journey.
    orders["approval_lag_hours"] = hours(
        orders["order_approved_at"] - orders["order_purchase_timestamp"]
    )
    orders["seller_handling_days"] = days(
        orders["order_delivered_carrier_date"] - orders["order_approved_at"]
    )
    orders["carrier_transit_days"] = days(
        orders["order_delivered_customer_date"] - orders["order_delivered_carrier_date"]
    )
    orders["delivery_days"] = days(
        orders["order_delivered_customer_date"] - orders["order_purchase_timestamp"]
    )
    orders["estimated_delivery_days"] = days(
        orders["order_estimated_delivery_date"] - orders["order_purchase_timestamp"]
    )
    orders["delivery_delta_days"] = days(
        orders["order_delivered_customer_date"] - orders["order_estimated_delivery_date"]
    )
    orders["is_late"] = orders["delivery_delta_days"] > 0

    # A handful of orders have negative stage durations from timestamp glitches.
    for col in ("approval_lag_hours", "seller_handling_days", "carrier_transit_days"):
        orders.loc[orders[col] < 0, col] = np.nan

    # One review score per order (a few orders carry two reviews).
    review_agg = reviews_raw.groupby("order_id").agg(
        review_score=("review_score", "mean"),
        has_comment=("review_comment_message", lambda s: bool(s.notna().any())),
    )
    orders = orders.merge(review_agg, on="order_id", how="left")
    orders["review_score"] = orders["review_score"].round()

    orders = orders.merge(
        customers[["customer_id", "customer_state", "customer_city", "customer_zip_code_prefix"]],
        on="customer_id",
        how="left",
    )
    orders["customer_region"] = orders["customer_state"].map(REGION_BY_STATE).fillna("Other")

    orders = orders.merge(basket, on="order_id", how="left")
    orders = orders.merge(_zip_centroids(ecom_dir), on="customer_zip_code_prefix", how="left")
    return orders


def _zip_centroids(ecom_dir) -> pd.DataFrame:
    """Median lat/lng per zip code prefix, used for the hexbin map."""
    geo = _csv(
        ecom_dir,
        "geolocation_dataset.csv",
        usecols=["geolocation_zip_code_prefix", "geolocation_lat", "geolocation_lng"],
    )
    geo = geo[
        geo["geolocation_lat"].between(LAT_MIN, LAT_MAX)
        & geo["geolocation_lng"].between(LNG_MIN, LNG_MAX)
    ]
    return (
        geo.groupby("geolocation_zip_code_prefix")
        .agg(lat=("geolocation_lat", "median"), lng=("geolocation_lng", "median"))
        .reset_index()
        .rename(columns={"geolocation_zip_code_prefix": "customer_zip_code_prefix"})
    )


def _build_order_sellers(items: pd.DataFrame) -> pd.DataFrame:
    """One row per (order, seller): the grain for fair seller scorecards.

    Aggregating seller CSAT at item level would over-weight sellers who ship many
    units per order, so we collapse to the pair first.
    """
    pairs = items.groupby(["order_id", "seller_id"], as_index=False).agg(
        seller_state=("seller_state", "first"),
        items=("order_item_id", "count"),
        revenue=("price", "sum"),
        freight=("freight_value", "sum"),
        review_score=("review_score", "first"),
        is_late=("is_late", "first"),
        delivery_days=("delivery_days", "first"),
        purchase_month=("purchase_month", "first"),
        category=("category", "first"),
    )
    pairs["seller_state"] = pairs["seller_state"].fillna("Unknown")
    return pairs


def _build_reviews(reviews_raw: pd.DataFrame) -> pd.DataFrame:
    """Review comments, normalised once for keyword classification.

    Comments are lowercased and stripped of accents so that a keyword like
    "atraso" also matches "atrasô"/"ATRASO" without maintaining variants.
    """
    reviews = reviews_raw[reviews_raw["review_comment_message"].notna()].copy()
    reviews["comment"] = (
        reviews["review_comment_message"]
        .str.lower()
        .str.normalize("NFKD")
        .str.encode("ascii", errors="ignore")
        .str.decode("utf-8")
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )
    return reviews[["review_id", "order_id", "review_score", "comment"]].reset_index(drop=True)


def _build_funnel(funnel_dir) -> pd.DataFrame:
    """Closed deals joined to their marketing qualified lead."""
    mql = _csv(funnel_dir, "marketing_qualified_leads_dataset.csv")
    closed = _csv(funnel_dir, "closed_deals_dataset.csv")
    funnel = closed.merge(mql, on="mql_id", how="left")
    funnel["origin"] = funnel["origin"].fillna("unknown")
    funnel["business_segment"] = funnel["business_segment"].fillna("unknown")
    funnel["declared_monthly_revenue"] = funnel["declared_monthly_revenue"].fillna(0)
    return funnel
