"""Analytics layer.

One function per dashboard visual. Each takes a `Scope` (the filtered slice of the
marketplace) and returns plain JSON-ready dicts/lists in exactly the shape the
Next.js components consume, so the frontend can swap its static JSON import for
these endpoints without touching a chart.
"""

from __future__ import annotations

import re
from typing import Optional

import numpy as np
import pandas as pd

from .data import REGION_BY_STATE, get_dataset
from .scope import Scope

# ---------------------------------------------------------------------------
# Bucket definitions (kept in one place: the report and the API must agree)
# ---------------------------------------------------------------------------

DELIVERY_BINS = [-1, 5, 10, 15, 25, 10_000]
DELIVERY_LABELS = ["0-5d", "6-10d", "11-15d", "16-25d", "25+d"]

DELAY_BINS = [-1, 1, 2, 4, 10_000]
DELAY_LABELS = ["0-1d", "2d", "3-4d", "5d+"]

SELLER_COUNT_LABELS = ["1 Seller", "2 Sellers", "3 Sellers", "4+ Sellers"]
ITEM_COUNT_LABELS = ["1 Item", "2 Items", "3 Items", "4+ Items"]

# Hexbin grid resolution in degrees (~200 km cells: coarse enough to be readable
# at national zoom, fine enough to separate coastal hubs from the interior).
GRID_STEP_LAT = 1.8
GRID_STEP_LNG = 2.0


def _num(value, digits: int = 2) -> float:
    """Round to a JSON-safe float; empty/NaN aggregates become 0."""
    if value is None or (isinstance(value, float) and np.isnan(value)) or pd.isna(value):
        return 0.0
    return round(float(value), digits)


def _pct(series: pd.Series, digits: int = 1) -> float:
    """Share of True values (or of a boolean mask) as a percentage."""
    return _num(series.mean() * 100, digits) if len(series) else 0.0


def _count_label(n: float, unit: str) -> str:
    """'1 Seller' / '4+ Sellers' style bucket label."""
    if pd.isna(n):
        return f"1 {unit}"
    n = int(n)
    plural = unit if n == 1 else unit + "s"
    return f"{n} {plural}" if n <= 3 else f"4+ {unit}s"


# ---------------------------------------------------------------------------
# Executive KPI strip
# ---------------------------------------------------------------------------

def kpis(scope: Scope) -> dict:
    delivered = scope.orders
    scores = delivered["review_score"].dropna()
    on_time = delivered.loc[~delivered["is_late"], "review_score"].dropna()
    late = delivered.loc[delivered["is_late"], "review_score"].dropna()

    on_time_avg = _num(on_time.mean())
    late_avg = _num(late.mean())
    revenue_shares = _seller_revenue_shares(scope)

    return {
        "total_orders": int(len(scope.all_orders)),
        "delivered_orders": int(len(delivered)),
        "overall_avg_score": _num(scores.mean()),
        "late_rate_pct": _pct(delivered["is_late"]),
        "avg_delivery_days": _num(delivered["delivery_days"].mean(), 1),
        "avg_carrier_transit": _num(delivered["carrier_transit_days"].mean(), 1),
        "avg_seller_handling": _num(delivered["seller_handling_days"].mean(), 1),
        "on_time_avg_score": on_time_avg,
        "late_avg_score": late_avg,
        "score_gap": _num(on_time_avg - late_avg),
        "one_star_pct": _pct(scores == 1),
        "five_star_pct": _pct(scores == 5),
        **revenue_shares,
    }


def _seller_revenue_shares(scope: Scope) -> dict:
    """Revenue concentration: how much of GMV the largest sellers carry."""
    revenue = (
        scope.order_sellers.groupby("seller_id")["revenue"].sum().sort_values(ascending=False)
    )
    total = float(revenue.sum())
    if total <= 0:
        return {"top_10pct_seller_rev_share": 0.0, "top_1pct_seller_rev_share": 0.0}

    def share(fraction: float) -> float:
        top_n = max(1, int(round(len(revenue) * fraction)))
        return _num(revenue.head(top_n).sum() / total * 100, 1)

    return {
        "top_10pct_seller_rev_share": share(0.10),
        "top_1pct_seller_rev_share": share(0.01),
    }


# ---------------------------------------------------------------------------
# Visual 1 -- The Satisfaction Cliff
# ---------------------------------------------------------------------------

def satisfaction_cliff(scope: Scope) -> list[dict]:
    """Average review score and star mix across delivery lead-time tiers."""
    delivered = scope.orders
    buckets = pd.cut(delivered["delivery_days"], bins=DELIVERY_BINS, labels=DELIVERY_LABELS)

    rows = []
    for label in DELIVERY_LABELS:
        scores = delivered.loc[buckets == label, "review_score"].dropna()
        rows.append(
            {
                "bucket": label,
                "avg_score": _num(scores.mean()),
                "one_star_pct": _pct(scores == 1),
                "five_star_pct": _pct(scores == 5),
                "order_count": int((buckets == label).sum()),
            }
        )
    return rows


# ---------------------------------------------------------------------------
# Visual 2 -- Root cause: seller handling vs carrier transit
# ---------------------------------------------------------------------------

def root_cause_analysis(scope: Scope) -> list[dict]:
    """Same delay length, two owners: which stage hurts satisfaction more?"""
    delivered = scope.orders
    handling = pd.cut(delivered["seller_handling_days"], bins=DELAY_BINS, labels=DELAY_LABELS)
    transit = pd.cut(delivered["carrier_transit_days"], bins=DELAY_BINS, labels=DELAY_LABELS)

    rows = []
    for label in DELAY_LABELS:
        seller_scores = delivered.loc[handling == label, "review_score"].dropna()
        carrier_scores = delivered.loc[transit == label, "review_score"].dropna()
        rows.append(
            {
                "delay_bucket": label,
                "seller_handling_score": _num(seller_scores.mean()),
                "carrier_transit_score": _num(carrier_scores.mean()),
                "seller_count": int((handling == label).sum()),
                "carrier_count": int((transit == label).sum()),
            }
        )
    return rows


# ---------------------------------------------------------------------------
# Visual 4 -- Logistics complexity (sellers per order)
# ---------------------------------------------------------------------------

def logistics_complexity(scope: Scope) -> list[dict]:
    """Does splitting an order across sellers cost satisfaction?"""
    delivered = scope.orders
    labels = delivered["n_sellers"].map(lambda n: _count_label(n, "Seller"))

    rows = []
    for label in SELLER_COUNT_LABELS:
        scores = delivered.loc[labels == label, "review_score"].dropna()
        rows.append(
            {
                "sellers_category": label,
                "avg_review_score": _num(scores.mean()),
                "order_count": int((labels == label).sum()),
                "one_star_pct": _pct(scores == 1),
            }
        )
    return rows


# ---------------------------------------------------------------------------
# Visuals 3 & 9 -- Seller risk quadrant with Pareto flags
# ---------------------------------------------------------------------------

def seller_scorecard(scope: Scope, min_orders: int = 10) -> pd.DataFrame:
    """Revenue / CSAT / lateness per seller, ranked by revenue with a Pareto curve."""
    sellers = (
        scope.order_sellers.groupby("seller_id")
        .agg(
            seller_orders=("order_id", "nunique"),
            total_revenue=("revenue", "sum"),
            avg_review_score=("review_score", "mean"),
            late_rate=("is_late", "mean"),
            avg_delivery_days=("delivery_days", "mean"),
            state=("seller_state", "first"),
        )
        .reset_index()
    )
    sellers = sellers[sellers["seller_orders"] >= min_orders]
    sellers = sellers.sort_values("total_revenue", ascending=False).reset_index(drop=True)
    if sellers.empty:
        return sellers

    sellers["total_revenue"] = sellers["total_revenue"].round(2)
    sellers["avg_review_score"] = sellers["avg_review_score"].round(2)
    sellers["avg_delivery_days"] = sellers["avg_delivery_days"].round(1)
    sellers["late_rate"] = (sellers["late_rate"] * 100).round(1)
    sellers["rank"] = sellers.index + 1
    sellers["cum_rev_pct"] = (
        sellers["total_revenue"].cumsum() / sellers["total_revenue"].sum() * 100
    ).round(1)
    sellers["in_pareto_80"] = sellers["cum_rev_pct"] <= 80.0
    return sellers


def seller_risk_quadrant(scope: Scope, min_orders: int = 10, limit: int = 250) -> dict:
    """Scatter of revenue vs CSAT, flagging the top-5 high-revenue / low-CSAT sellers."""
    sellers = seller_scorecard(scope, min_orders)
    if sellers.empty:
        return {
            "platform_avg_revenue": 0.0,
            "platform_avg_score": 0.0,
            "score_p25_cutoff": 0.0,
            "sellers": [],
        }

    score_p25 = _num(sellers["avg_review_score"].quantile(0.25))
    at_risk = sellers[sellers["avg_review_score"] <= score_p25].head(5)  # already revenue-sorted
    top_risk_ids = set(at_risk["seller_id"])

    points = [
        {
            "seller_id": f"{row.seller_id[:8]}...",
            "full_seller_id": row.seller_id,
            "revenue": _num(row.total_revenue),
            "avg_review_score": _num(row.avg_review_score),
            "orders": int(row.seller_orders),
            "late_rate": _num(row.late_rate, 1),
            "state": row.state,
            "in_pareto_80": bool(row.in_pareto_80),
            "is_top_risk": row.seller_id in top_risk_ids,
            "rank": int(row.rank),
        }
        for row in sellers.head(limit).itertuples()
    ]

    return {
        "platform_avg_revenue": _num(sellers["total_revenue"].mean()),
        "platform_avg_score": _num(sellers["avg_review_score"].mean()),
        "score_p25_cutoff": score_p25,
        "sellers": points,
    }


def seller_table(
    scope: Scope,
    min_orders: int = 10,
    risk_tier: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> dict:
    """Paginated seller list with an operational risk tier -- the intervention list."""
    sellers = seller_scorecard(scope, min_orders)
    if not sellers.empty:
        sellers = sellers.assign(risk_tier=sellers.apply(_risk_tier, axis=1))
        if risk_tier:
            sellers = sellers[sellers["risk_tier"].str.lower() == risk_tier.lower()]

    total = int(len(sellers))
    page = sellers.iloc[offset : offset + limit]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "sellers": [
            {
                "seller_id": row.seller_id,
                "state": row.state,
                "orders": int(row.seller_orders),
                "revenue": _num(row.total_revenue),
                "avg_review_score": _num(row.avg_review_score),
                "late_rate": _num(row.late_rate, 1),
                "avg_delivery_days": _num(row.avg_delivery_days, 1),
                "cum_rev_pct": _num(row.cum_rev_pct, 1),
                "in_pareto_80": bool(row.in_pareto_80),
                "risk_tier": row.risk_tier,
                "rank": int(row.rank),
            }
            for row in page.itertuples()
        ],
    }


def _risk_tier(row: pd.Series) -> str:
    """Operational tier used for the recommended actions in the report."""
    if row["late_rate"] > 15 or row["avg_review_score"] < 3.5:
        return "Critical Risk"
    if row["late_rate"] > 8 or row["avg_review_score"] < 4.0:
        return "Watchlist"
    if row["avg_review_score"] >= 4.3 and row["late_rate"] < 5:
        return "Star Seller"
    return "Healthy"


def seller_detail(scope: Scope, seller_id: str) -> Optional[dict]:
    """Drill-down for one seller: headline KPIs, top categories, monthly trend."""
    rows = scope.order_sellers[scope.order_sellers["seller_id"] == seller_id]
    if rows.empty:
        return None

    scores = rows["review_score"].dropna()
    monthly = (
        rows.groupby("purchase_month")
        .agg(orders=("order_id", "nunique"), revenue=("revenue", "sum"),
             avg_review_score=("review_score", "mean"), late_rate=("is_late", "mean"))
        .reset_index()
        .sort_values("purchase_month")
    )
    categories = (
        rows.groupby("category")
        .agg(items=("items", "sum"), revenue=("revenue", "sum"),
             avg_review_score=("review_score", "mean"))
        .reset_index()
        .sort_values("revenue", ascending=False)
        .head(8)
    )

    return {
        "seller_id": seller_id,
        "state": rows["seller_state"].iloc[0],
        "orders": int(rows["order_id"].nunique()),
        "items": int(rows["items"].sum()),
        "revenue": _num(rows["revenue"].sum()),
        "avg_review_score": _num(scores.mean()),
        "one_star_pct": _pct(scores == 1),
        "late_rate": _pct(rows["is_late"]),
        "avg_delivery_days": _num(rows["delivery_days"].mean(), 1),
        "risk_tier": _risk_tier(
            {"late_rate": _pct(rows["is_late"]), "avg_review_score": _num(scores.mean())}
        ),
        "monthly": [
            {
                "month": row.purchase_month,
                "orders": int(row.orders),
                "revenue": _num(row.revenue),
                "avg_review_score": _num(row.avg_review_score),
                "late_rate": _num(row.late_rate * 100, 1),
            }
            for row in monthly.itertuples()
        ],
        "top_categories": [
            {
                "category": row.category,
                "items": int(row.items),
                "revenue": _num(row.revenue),
                "avg_review_score": _num(row.avg_review_score),
            }
            for row in categories.itertuples()
        ],
    }


# ---------------------------------------------------------------------------
# Visual 7 -- Order splitting matrix (sellers x items)
# ---------------------------------------------------------------------------

def order_splitting_matrix(scope: Scope) -> list[dict]:
    """Bubble matrix: how basket shape maps to revenue and satisfaction."""
    delivered = scope.orders
    if delivered.empty:
        return []

    grid = delivered.assign(
        sellers_cat=delivered["n_sellers"].map(lambda n: _count_label(n, "Seller")),
        items_cat=delivered["n_items"].map(lambda n: _count_label(n, "Item")),
    )

    rows = []
    for s_idx, s_cat in enumerate(SELLER_COUNT_LABELS, start=1):
        for i_idx, i_cat in enumerate(ITEM_COUNT_LABELS, start=1):
            cell = grid[(grid["sellers_cat"] == s_cat) & (grid["items_cat"] == i_cat)]
            if cell.empty:
                continue
            rows.append(
                {
                    "sellers_cat": s_cat,
                    "sellers_x": s_idx,
                    "items_cat": i_cat,
                    "items_y": i_idx,
                    "order_count": int(len(cell)),
                    "total_revenue": _num(cell["total_price"].sum()),
                    "avg_review_score": _num(cell["review_score"].mean()),
                }
            )
    return rows


# ---------------------------------------------------------------------------
# Visual 5 -- Regional delivery performance
# ---------------------------------------------------------------------------

def regional_performance(scope: Scope, min_orders: int = 300) -> list[dict]:
    """Delivery time and lateness by customer state, worst first."""
    delivered = scope.orders
    if delivered.empty:
        return []

    states = (
        delivered.groupby("customer_state")
        .agg(
            order_count=("order_id", "count"),
            avg_delivery_days=("delivery_days", "mean"),
            late_rate=("is_late", "mean"),
            avg_review_score=("review_score", "mean"),
        )
        .reset_index()
    )
    # Volume floor keeps the ranking stable; it is relaxed when a narrow filter
    # would otherwise leave the chart empty.
    filtered = states[states["order_count"] >= min_orders]
    states = filtered if not filtered.empty else states
    states = states.sort_values("avg_delivery_days", ascending=False)

    return [
        {
            "state": row.customer_state,
            "region": REGION_BY_STATE.get(row.customer_state, "Other"),
            "order_count": int(row.order_count),
            "avg_delivery_days": _num(row.avg_delivery_days, 1),
            "late_rate_pct": _num(row.late_rate * 100, 1),
            "avg_review_score": _num(row.avg_review_score),
        }
        for row in states.itertuples()
    ]


# ---------------------------------------------------------------------------
# Visual 6 -- Logistics bottleneck parallel coordinates
# ---------------------------------------------------------------------------

def parallel_coordinates(scope: Scope, per_score: int = 30) -> dict:
    """A stratified sample of orders across the three journey stages, by star rating.

    Sampling is seeded, so the same filter always returns the same lines.
    """
    cols = ["approval_lag_hours", "seller_handling_days", "carrier_transit_days", "review_score"]
    frame = scope.orders.dropna(subset=cols)
    frame = frame[
        frame["approval_lag_hours"].between(0, 96)
        & frame["seller_handling_days"].between(0, 20)
        & frame["carrier_transit_days"].between(0, 45)
    ]

    samples = []
    for score in (1, 2, 3, 4, 5):
        tier = frame[frame["review_score"] == score]
        if tier.empty:
            continue
        for row in tier.sample(n=min(per_score, len(tier)), random_state=42).itertuples():
            samples.append(
                {
                    "order_id": row.order_id[:8],
                    "approval_lag_hours": _num(row.approval_lag_hours, 1),
                    "seller_handling_days": _num(row.seller_handling_days, 1),
                    "carrier_transit_days": _num(row.carrier_transit_days, 1),
                    "review_score": int(row.review_score),
                }
            )

    return {
        "meta": {
            "approval_lag_max": 72.0,
            "seller_handling_max": 15.0,
            "carrier_transit_max": 40.0,
        },
        "samples": samples,
    }


# ---------------------------------------------------------------------------
# Visual 8 -- Regional infrastructure hexbin map
# ---------------------------------------------------------------------------

def hexbin_map(scope: Scope, min_orders: int = 15) -> list[dict]:
    """Customer locations binned to a lat/lng grid, coloured by carrier transit time."""
    geo = scope.orders.dropna(subset=["lat", "lng", "carrier_transit_days"])
    if geo.empty:
        return []

    geo = geo.assign(
        grid_lat=(np.round(geo["lat"] / GRID_STEP_LAT) * GRID_STEP_LAT).round(2),
        grid_lng=(np.round(geo["lng"] / GRID_STEP_LNG) * GRID_STEP_LNG).round(2),
    )
    bins = (
        geo.groupby(["grid_lat", "grid_lng"])
        .agg(
            order_count=("order_id", "count"),
            median_carrier_transit=("carrier_transit_days", "median"),
            avg_review_score=("review_score", "mean"),
            primary_state=("customer_state", lambda s: s.mode().iat[0] if not s.mode().empty else ""),
        )
        .reset_index()
    )
    filtered = bins[bins["order_count"] >= min_orders]
    bins = filtered if not filtered.empty else bins

    return [
        {
            "lat": _num(row.grid_lat, 2),
            "lng": _num(row.grid_lng, 2),
            "order_count": int(row.order_count),
            "median_carrier_transit": _num(row.median_carrier_transit, 1),
            "avg_review_score": _num(row.avg_review_score),
            "state": row.primary_state,
        }
        for row in bins.itertuples()
    ]


# ---------------------------------------------------------------------------
# Visual 10 -- Complaint sentiment treemap
# ---------------------------------------------------------------------------

# Portuguese keyword taxonomy. Comments are matched top-down and each comment is
# counted once, so a "great product but arrived late" review lands in the delay
# theme -- deliberately, since the operational signal is the delay.
SENTIMENT_TOPICS = [
    {
        "name": "Delayed or Missing Delivery",
        "color": "#EF4444",
        "subcategories": [
            {
                "name": "Passed Estimated Date",
                "keywords": ["prazo", "atraso", "atrasad", "demorou", "demora", "chegou tarde"],
            },
            {
                "name": "Order Never Arrived",
                "keywords": ["nao recebi", "nao chegou", "nunca recebi", "extraviad", "nao entregue"],
            },
            {
                "name": "Carrier Tracking Blackout",
                "keywords": ["rastrea", "sem atualizacao", "correios", "transportadora", "aguardando"],
            },
        ],
    },
    {
        "name": "Defective & Damaged Goods",
        "color": "#F97316",
        "subcategories": [
            {"name": "Damaged in Transit", "keywords": ["quebrad", "amassad", "danificad", "embalagem", "rasgad"]},
            {"name": "Factory Defect / DOA", "keywords": ["defeito", "nao funciona", "parou de funcionar", "estragad"]},
            {"name": "Poor Material Quality", "keywords": ["qualidade ruim", "pessima qualidade", "fragil", "material ruim", "frágil"]},
        ],
    },
    {
        "name": "Incorrect / Incomplete Order",
        "color": "#EAB308",
        "subcategories": [
            {"name": "Missing Multi-item Components", "keywords": ["faltou", "faltando", "incomplet", "veio so um", "veio apenas"]},
            {"name": "Wrong Specification / Variant", "keywords": ["produto errado", "cor errada", "tamanho errado", "modelo diferente", "veio errado", "errado"]},
            {"name": "Counterfeit / Misrepresented", "keywords": ["diferente da foto", "propaganda enganosa", "falsificad", "nao e original"]},
        ],
    },
    {
        "name": "Customer Service & Refund Friction",
        "color": "#8B5CF6",
        "subcategories": [
            {"name": "Unresponsive Seller / SAC", "keywords": ["nao responde", "sem retorno", "nenhuma resposta", "atendimento", "sac"]},
            {"name": "Delayed Refund / Voucher", "keywords": ["estorno", "reembolso", "dinheiro de volta", "devolucao do valor"]},
            {"name": "Cancellation & Return Friction", "keywords": ["cancelamento", "cancelei", "devolver", "troca", "reclame aqui"]},
        ],
    },
    {
        "name": "Positive & Satisfied Feedback",
        "color": "#10B981",
        "subcategories": [
            {"name": "Delivered Ahead of Time", "keywords": ["antes do prazo", "chegou antes", "entrega rapida", "super rapido", "rapido"]},
            {"name": "Flawless Product Quality", "keywords": ["otimo produto", "excelente", "otim", "perfeit", "adorei", "muito bom", "boa qualidade"]},
            {"name": "Recommended Vendor", "keywords": ["recomendo", "confiavel", "nota 10", "parabens", "gostei"]},
        ],
    },
]


def _keyword_mask(comments: pd.Series, keywords: list[str]) -> pd.Series:
    pattern = "|".join(re.escape(word) for word in keywords)
    return comments.str.contains(pattern, regex=True, na=False)


def sentiment_treemap(scope: Scope) -> list[dict]:
    """Classify review comments into operational themes and sub-themes.

    Unlike a word cloud this keeps the hierarchy leadership needs: which theme owns
    the most complaints, and which specific failure drives that theme.
    """
    comments = scope.reviews["comment"]
    if comments.empty:
        return [
            {"name": topic["name"], "value": 0, "color": topic["color"], "subcategories": []}
            for topic in SENTIMENT_TOPICS
        ]

    unassigned = pd.Series(True, index=comments.index)
    result = []

    for topic in SENTIMENT_TOPICS:
        topic_keywords = [kw for sub in topic["subcategories"] for kw in sub["keywords"]]
        topic_mask = _keyword_mask(comments, topic_keywords) & unassigned
        unassigned &= ~topic_mask

        remaining = topic_mask.copy()
        subcategories = []
        for sub in topic["subcategories"]:
            sub_mask = _keyword_mask(comments, sub["keywords"]) & remaining
            remaining &= ~sub_mask
            subcategories.append(
                {
                    "name": sub["name"],
                    "weight": int(sub_mask.sum()),
                    "sample_keywords": sub["keywords"][:3],
                }
            )

        result.append(
            {
                "name": topic["name"],
                "value": int(topic_mask.sum()),
                "color": topic["color"],
                "subcategories": [s for s in subcategories if s["weight"] > 0],
            }
        )

    return sorted(result, key=lambda topic: topic["value"], reverse=True)


# ---------------------------------------------------------------------------
# Supporting insight endpoints
# ---------------------------------------------------------------------------

def category_risk(scope: Scope, min_items: int = 100, limit: int = 35) -> list[dict]:
    """Category scorecard with a volume/CSAT quadrant label."""
    items = scope.items
    if items.empty:
        return []

    agg = (
        items.groupby("category")
        .agg(
            total_items=("order_item_id", "count"),
            total_gmv=("price", "sum"),
            avg_price=("price", "mean"),
            avg_freight=("freight_value", "mean"),
            avg_score=("review_score", "mean"),
            late_pct=("is_late", "mean"),
            avg_weight_kg=("product_weight_g", "mean"),
            one_star_pct=("review_score", lambda s: (s == 1).mean() * 100),
        )
        .reset_index()
    )
    filtered = agg[agg["total_items"] >= min_items]
    agg = (filtered if not filtered.empty else agg).sort_values("total_items", ascending=False)

    median_score = agg["avg_score"].median()
    median_volume = agg["total_items"].median()

    def quadrant(score: float, volume: float) -> str:
        high_csat, high_volume = score >= median_score, volume >= median_volume
        if high_csat and high_volume:
            return "Growth Engine"
        if high_csat:
            return "Niche Star"
        if high_volume:
            return "High-Risk Giant"
        return "Underperformer"

    return [
        {
            "category": row.category,
            "total_items": int(row.total_items),
            "total_gmv": _num(row.total_gmv),
            "avg_price": _num(row.avg_price),
            "avg_freight": _num(row.avg_freight),
            "freight_ratio_pct": _num(row.avg_freight / row.avg_price * 100, 1)
            if row.avg_price
            else 0.0,
            "avg_weight_kg": _num((row.avg_weight_kg or 0) / 1000, 2),
            "avg_score": _num(row.avg_score),
            "late_pct": _num(row.late_pct * 100, 1),
            "one_star_pct": _num(row.one_star_pct, 1),
            "quadrant": quadrant(row.avg_score, row.total_items),
        }
        for row in agg.head(limit).itertuples()
    ]


def monthly_trend(scope: Scope) -> list[dict]:
    """Growth vs satisfaction over time -- the trade-off leadership is managing."""
    delivered = scope.orders
    if delivered.empty:
        return []

    monthly = (
        delivered.groupby("purchase_month")
        .agg(
            orders=("order_id", "count"),
            gmv=("total_price", "sum"),
            avg_score=("review_score", "mean"),
            late_rate=("is_late", "mean"),
            avg_delivery_days=("delivery_days", "median"),
        )
        .reset_index()
        .sort_values("purchase_month")
    )
    # The dataset tails off outside this window, which otherwise distorts the trend.
    monthly = monthly[monthly["purchase_month"].between("2017-01", "2018-08")]

    return [
        {
            "month": row.purchase_month,
            "orders": int(row.orders),
            "gmv": _num(row.gmv),
            "avg_score": _num(row.avg_score),
            "on_time_pct": _num((1 - row.late_rate) * 100, 1),
            "late_rate_pct": _num(row.late_rate * 100, 1),
            "avg_delivery_days": _num(row.avg_delivery_days, 1),
        }
        for row in monthly.itertuples()
    ]


def marketing_funnel() -> dict:
    """Seller acquisition mix -- where new supply comes from, and at what quality.

    Not affected by the dashboard filters: the funnel is lead-level, not order-level.
    """
    funnel = get_dataset().funnel
    dataset = get_dataset()

    seller_quality = (
        dataset.order_sellers.groupby("seller_id")
        .agg(orders=("order_id", "nunique"), avg_review_score=("review_score", "mean"),
             revenue=("revenue", "sum"))
        .reset_index()
    )
    joined = funnel.merge(seller_quality, on="seller_id", how="left")

    by_origin = (
        joined.groupby("origin")
        .agg(
            closed_deals=("mql_id", "count"),
            active_sellers=("orders", lambda s: int(s.notna().sum())),
            declared_revenue=("declared_monthly_revenue", "sum"),
            avg_review_score=("avg_review_score", "mean"),
            marketplace_revenue=("revenue", "sum"),
        )
        .reset_index()
        .sort_values("closed_deals", ascending=False)
    )
    by_segment = (
        joined.groupby("business_segment")
        .agg(
            seller_count=("mql_id", "count"),
            avg_declared_revenue=("declared_monthly_revenue", "mean"),
            avg_review_score=("avg_review_score", "mean"),
        )
        .reset_index()
        .sort_values("seller_count", ascending=False)
        .head(12)
    )

    return {
        "total_leads": int(len(funnel)),
        "converted_sellers": int(joined["orders"].notna().sum()),
        "by_origin": [
            {
                "origin": row.origin,
                "closed_deals": int(row.closed_deals),
                "active_sellers": int(row.active_sellers),
                "declared_revenue": _num(row.declared_revenue),
                "marketplace_revenue": _num(row.marketplace_revenue),
                "avg_review_score": _num(row.avg_review_score),
            }
            for row in by_origin.itertuples()
        ],
        "by_segment": [
            {
                "segment": row.business_segment,
                "seller_count": int(row.seller_count),
                "avg_declared_revenue": _num(row.avg_declared_revenue),
                "avg_review_score": _num(row.avg_review_score),
            }
            for row in by_segment.itertuples()
        ],
    }


def filter_options() -> dict:
    """Values the frontend can offer in its filter controls."""
    dataset = get_dataset()
    orders = dataset.orders
    return {
        "states": sorted(orders["customer_state"].dropna().unique().tolist()),
        "regions": sorted(orders["customer_region"].dropna().unique().tolist()),
        "categories": sorted(orders["primary_category"].dropna().unique().tolist()),
        "date_range": {
            "min": str(orders["purchase_date"].min()),
            "max": str(orders["purchase_date"].max()),
        },
    }


def dashboard_payload(scope: Scope) -> dict:
    """The full dashboard in one response.

    Same keys as the frontend's `team_analytics_data.json`, so `page.tsx` can fetch
    this instead of importing the static file.
    """
    return {
        "filters": scope.filters.as_dict(),
        "kpis": kpis(scope),
        "satisfaction_cliff": satisfaction_cliff(scope),
        "root_cause_analysis": root_cause_analysis(scope),
        "seller_risk_quadrant": seller_risk_quadrant(scope),
        "logistics_complexity": logistics_complexity(scope),
        "regional_performance": regional_performance(scope),
        "parallel_coordinates": parallel_coordinates(scope),
        "order_splitting_matrix": order_splitting_matrix(scope),
        "hexbin_map": hexbin_map(scope),
        "sentiment_treemap": sentiment_treemap(scope),
    }
