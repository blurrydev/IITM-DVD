# Marketplace Delivery & Satisfaction API (FastAPI backend)

Backend for the DVD Team 001 interactive dashboard. It reads the raw Brazilian
e-commerce CSVs, builds the enriched order-journey tables in memory, and serves the
executive KPIs plus all 10 core visuals as JSON — in exactly the shape the Next.js
dashboard components already expect, with live filters on top.

---

## 1. Quick start

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# optional: cp .env.example .env  and edit paths / origins
uvicorn app.main:app --reload --port 8000
```

- Interactive docs (Swagger): <http://localhost:8000/docs>
- Health check: <http://localhost:8000/api/health>
- Whole dashboard: <http://localhost:8000/api/dashboard>

**Data first:** the CSVs are not in git. Put the 9 raw files in `data/raw/` as described
in [`data/raw/readme.md`](../data/raw/readme.md) before starting the API. The backend
finds them automatically there (or in `data/`, `Project Dataset/`, or wherever
`DATA_DIR` points).

The first boot reads ~120 MB of CSVs and builds the analysis tables (~7 s, ~480 MB
peak), then pickles them to `backend/cache/` (~63 MB). Later boots load that cache in
under a second (~210 MB steady state). Delete `backend/cache/` — or call
`POST /api/admin/refresh` — to rebuild after the dataset changes.

Smoke test the analytics layer without starting a server:

```bash
python scripts/verify_payload.py
```

By default the CSVs are read from `../dvd-project-main/Project Dataset`. Point
`DATA_DIR` somewhere else if the dataset moves.

---

## 2. Endpoints

All dashboard routes accept the same optional filters, so any combination keeps the
whole dashboard internally consistent:

| Query param | Example | Meaning |
|---|---|---|
| `state` | `SP` | customer state (2-letter code) |
| `region` | `Northeast` | customer region |
| `category` | `Bed Bath Table` | product category of the order's highest-value item |
| `date_from` / `date_to` | `2018-01-01` | purchase-date window |

### Core dashboard

| Method | Path | Visual | Returns |
|---|---|---|---|
| GET | `/api/dashboard` | all | Everything below in one response |
| GET | `/api/kpis` | KPI strip | Volume, CSAT, late-vs-on-time gap, lead times, revenue concentration |
| GET | `/api/visuals/satisfaction-cliff` | 1 | Review score / star mix by delivery-time tier |
| GET | `/api/visuals/root-cause` | 2 | Seller handling vs carrier transit at equal delay lengths |
| GET | `/api/visuals/seller-risk-quadrant` | 3 & 9 | Revenue vs CSAT scatter, Pareto + top-5 risk flags |
| GET | `/api/visuals/logistics-complexity` | 4 | Satisfaction by sellers per order |
| GET | `/api/visuals/regional-performance` | 5 | Delivery days / late rate by state |
| GET | `/api/visuals/parallel-coordinates` | 6 | Approval lag → handling → transit paths by star rating |
| GET | `/api/visuals/order-splitting-matrix` | 7 | Sellers × items bubble matrix |
| GET | `/api/visuals/hexbin-map` | 8 | Geographic bins by median carrier transit |
| GET | `/api/visuals/sentiment-treemap` | 10 | Review comments classified into themes / sub-themes |

### Drill-downs and support

| Method | Path | Returns |
|---|---|---|
| GET | `/api/sellers` | Paginated seller list with risk tier (`min_orders`, `risk_tier`, `limit`, `offset`) |
| GET | `/api/sellers/{seller_id}` | One seller: KPIs, monthly trend, top categories |
| GET | `/api/insights/categories` | Category scorecard with volume/CSAT quadrant |
| GET | `/api/insights/monthly-trend` | Growth vs satisfaction by month |
| GET | `/api/insights/marketing-funnel` | Acquisition channels joined to the seller quality they produced |
| GET | `/api/filters` | Valid states, regions, categories, date range |
| GET | `/api/health` | Row counts and when the tables were built |
| POST | `/api/admin/refresh` | Rebuild from CSVs (needs `ADMIN_TOKEN`, sent as `X-Admin-Token`) |

Example:

```bash
curl "http://localhost:8000/api/visuals/satisfaction-cliff?state=BA"
curl "http://localhost:8000/api/sellers?risk_tier=Critical%20Risk&limit=10"
```

---

## 3. Layout

```
backend/
  app/
    main.py         FastAPI app: CORS, gzip, routers, startup warm-up
    config.py       Environment-driven settings and dataset path discovery
    data.py         CSV loading + enrichment into 5 analysis tables (pickle cache)
    scope.py        Shared filters -> a memoised, pre-filtered slice of the data
    analytics.py    One function per visual; returns JSON-ready dicts
    schemas.py      Pydantic response models (mirror the TS interfaces)
    routers/        meta, visuals, sellers, insights
  scripts/
    verify_payload.py   Checks the API payload matches the frontend's expected shape
  requirements.txt
```

Request flow: `router → scope_params (filters) → analytics function → pydantic model`.

---

## 4. How the numbers are derived

Built once at startup, from the raw CSVs:

**`orders`** — one row per order, with

- `approval_lag_hours` = approved − purchased
- `seller_handling_days` = handed to carrier − approved
- `carrier_transit_days` = delivered to customer − handed to carrier
- `delivery_days` = delivered − purchased, `delivery_delta_days` = delivered − estimated
- `is_late` = `delivery_delta_days > 0`
- `review_score` averaged then rounded per order (a few orders carry two reviews)
- customer state / region / lat-lng (median centroid of the customer's zip prefix)
- basket shape: `n_items`, `n_sellers`, `total_price`, plus the primary seller and
  category (the order's highest-value item)

**`order_sellers`** — one row per (order, seller). Seller CSAT and late rate are
computed at this grain, not per item, so a seller shipping many units in one order
isn't over-weighted. Seller revenue is item `price` (GMV, freight excluded).

**Other tables** — `items` (item level + order outcome), `reviews` (comments,
lowercased and accent-stripped for keyword matching), `funnel` (closed deals + leads).

Notes and deliberate choices:

- All delivery/CSAT visuals use **delivered orders only**; open and cancelled orders
  have no completed journey to measure.
- Negative stage durations from timestamp glitches are set to null rather than clipped
  to 0, so they don't drag averages toward zero.
- Geolocation rows outside Brazil's bounding box are dropped before computing
  zip-prefix centroids.
- Volume floors (state ≥ 300 orders, map cell ≥ 15 orders, seller ≥ 10 orders) keep
  rankings stable. They are query params, and are relaxed automatically when a narrow
  filter would otherwise leave a chart empty.
- The sentiment treemap classifies real comment text with a Portuguese keyword
  taxonomy (the earlier notebook used fixed illustrative weights). Each comment is
  counted once, matched top-down, so "great product but arrived late" counts as a
  delay complaint — the operational signal is the delay.
- KPI totals are recomputed from the full CSVs, so they can differ by a few tenths
  from figures in the EDA notebook, which worked from a pre-filtered export.

---

## 5. Connecting the dashboard to it

`integration/api.ts` is the client the Next.js dashboard uses. Copy it into the
dashboard app as `src/lib/api.ts` and point it at the API:

```bash
cp backend/integration/api.ts <dashboard-app>/src/lib/api.ts
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' >> <dashboard-app>/.env.local
```

Then in `src/app/page.tsx`, replace the static JSON import with a fetch:

```tsx
import { bundledDashboard, fetchDashboard, type DashboardData } from "@/lib/api";

const [analyticsData, setAnalyticsData] = useState<DashboardData>(bundledDashboard);
useEffect(() => { fetchDashboard().then(setAnalyticsData); }, []);
```

Nothing else changes: the payload keys are identical to `team_analytics_data.json`, so
`FulfillmentCliffView`, `SellerRiskQuadrantView`, `RegionalBottlenecksView` and
`SentimentTreemapView` receive exactly what they received from the static file. Pass
filters for interactivity — `fetchDashboard({ state: "BA" })`.

`fetchDashboard` falls back to the bundled JSON if the API is unreachable, so a build
deployed without a backend still renders.

Run both halves in two terminals:

```bash
cd backend && ./.venv/bin/uvicorn app.main:app --reload --port 8000
cd <dashboard-app> && npm run dev
```

What to check in the browser:

1. **Network tab** — a `GET /api/dashboard` when the page loads; the KPI strip and all
   10 visuals are drawn from that response.
2. **A filter round-trip.** Wire a state selector to `fetchDashboard({ state })` and the
   whole dashboard recomputes server-side: `BA` averages 3.93 stars and 19.3 days
   against 4.16 / 12.6 platform-wide, a far steeper satisfaction cliff than `SP`.
3. **The uvicorn terminal** — one line per interaction, e.g.
   `GET /api/dashboard?state=BA HTTP/1.1" 200 OK`.
4. **Stop the backend and reload.** The dashboard falls back to the bundled snapshot and
   the browser console notes it, instead of breaking.
5. **`http://localhost:8000/docs`** — call any endpoint directly and compare the JSON
   with what the charts draw.

For a deployed frontend, set `NEXT_PUBLIC_API_URL` to the deployed API URL and add that
frontend's origin to `CORS_ORIGINS` on the backend.

---

## 6. Deployment notes

- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add the deployed frontend origin to `CORS_ORIGINS`.
- The CSVs must ship with the service (set `DATA_DIR`), or pre-build `backend/cache/`
  and deploy that — the cache alone is enough to serve every endpoint.
- Memory: ~480 MB peak while building, ~210 MB serving from cache. On a 512 MB
  instance, deploy a pre-built cache rather than the CSVs.
- Responses are gzipped: the full dashboard is 95 KB of JSON, 17 KB on the wire.
