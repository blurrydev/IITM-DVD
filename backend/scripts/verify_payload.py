"""Smoke test: build the dashboard payload and check it against the frontend contract.

Compares the live payload's structure with the shape of the frontend's bundled
`team_analytics_data.json`, so a change in the analytics layer that would break a
chart shows up here instead of in the browser.

Run from the backend folder:
    python scripts/verify_payload.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import analytics, config  # noqa: E402
from app.scope import Filters, Scope  # noqa: E402

REFERENCE_JSON = (
    config.PROJECT_ROOT / "dvd-project-main" / "src" / "data" / "team_analytics_data.json"
)

failures: list[str] = []


def check(condition: bool, message: str) -> None:
    print(f"  {'ok  ' if condition else 'FAIL'}  {message}")
    if not condition:
        failures.append(message)


def keys_of(value):
    """Structural signature: dict keys, or the keys of a list's first item."""
    if isinstance(value, dict):
        return set(value)
    if isinstance(value, list) and value and isinstance(value[0], dict):
        return set(value[0])
    return None


def main() -> int:
    print("Building unfiltered dashboard payload ...")
    payload = analytics.dashboard_payload(Scope(Filters()))

    print("\nTop-level keys match the frontend contract:")
    if REFERENCE_JSON.exists():
        reference = json.loads(REFERENCE_JSON.read_text())
        for key, ref_value in reference.items():
            if key not in payload:
                check(False, f"{key} present")
                continue
            expected, actual = keys_of(ref_value), keys_of(payload[key])
            missing = (expected or set()) - (actual or set())
            check(not missing, f"{key}: no missing fields ({sorted(missing)} missing)"
                  if missing else f"{key}: fields match")
    else:
        print(f"  (reference JSON not found at {REFERENCE_JSON}, skipping shape diff)")

    print("\nSanity checks on the numbers:")
    kpis = payload["kpis"]
    check(kpis["delivered_orders"] > 90_000, f"delivered orders = {kpis['delivered_orders']:,}")
    check(1 <= kpis["overall_avg_score"] <= 5, f"avg review score = {kpis['overall_avg_score']}")
    check(kpis["score_gap"] > 0, f"on-time beats late by {kpis['score_gap']} stars")
    check(0 < kpis["late_rate_pct"] < 30, f"late rate = {kpis['late_rate_pct']}%")

    cliff = payload["satisfaction_cliff"]
    check(len(cliff) == 5, "satisfaction cliff has 5 delivery buckets")
    check(
        cliff[0]["avg_score"] > cliff[-1]["avg_score"],
        f"score falls from {cliff[0]['avg_score']} ({cliff[0]['bucket']}) "
        f"to {cliff[-1]['avg_score']} ({cliff[-1]['bucket']})",
    )
    check(
        all(b["order_count"] > 0 for b in cliff), "every delivery bucket has orders"
    )

    quadrant = payload["seller_risk_quadrant"]
    check(len(quadrant["sellers"]) > 0, f"{len(quadrant['sellers'])} sellers plotted")
    check(
        sum(s["is_top_risk"] for s in quadrant["sellers"]) <= 5,
        "at most 5 sellers flagged as top risk",
    )

    check(len(payload["regional_performance"]) > 10, "regional bars cover the major states")
    check(len(payload["hexbin_map"]) > 50, f"{len(payload['hexbin_map'])} map cells")
    check(
        len(payload["parallel_coordinates"]["samples"]) > 100,
        "parallel coordinates sampled across all star tiers",
    )

    treemap = payload["sentiment_treemap"]
    check(len(treemap) == 5, "treemap has 5 themes")
    check(
        all(t["value"] > 0 for t in treemap),
        "every theme matched real comments: "
        + ", ".join(f"{t['name'].split()[0]}={t['value']:,}" for t in treemap),
    )

    print("\nFiltered scope still consistent (state=SP):")
    sp = analytics.dashboard_payload(Scope(Filters(state="SP")))
    check(
        sp["kpis"]["delivered_orders"] < kpis["delivered_orders"],
        f"SP delivered orders = {sp['kpis']['delivered_orders']:,}",
    )
    check(
        sp["kpis"]["avg_delivery_days"] < kpis["avg_delivery_days"],
        f"SP delivers faster than the platform: {sp['kpis']['avg_delivery_days']}d "
        f"vs {kpis['avg_delivery_days']}d",
    )
    check(
        all(row["state"] == "SP" for row in sp["regional_performance"]),
        "regional rows respect the state filter",
    )

    print()
    if failures:
        print(f"{len(failures)} check(s) failed.")
        return 1
    print("All checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
