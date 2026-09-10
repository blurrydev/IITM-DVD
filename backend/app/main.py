"""FastAPI application for the Marketplace Delivery & Satisfaction dashboard.

Serves the executive KPIs and the 10 core visuals computed live from the raw
e-commerce CSVs, with shared state / region / category / date filters.

Run locally:
    uvicorn app.main:app --reload --port 8000
Docs:
    http://localhost:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from . import config, data
from .routers import insights, meta, sellers, visuals

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm the analysis tables before serving so the first request is fast."""
    if config.EAGER_LOAD:
        dataset = data.get_dataset()
        log.info(
            "Ready: %s orders (%s delivered)", len(dataset.orders), len(dataset.delivered)
        )
    yield


app = FastAPI(
    title="Marketplace Delivery & Satisfaction API",
    description=(
        "Backend for the DVD Team 001 interactive dashboard: order journey, delivery "
        "performance, seller risk and review sentiment for a Brazilian marketplace."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
# Chart payloads compress well: the full dashboard is 95 KB of JSON, 17 KB gzipped.
app.add_middleware(GZipMiddleware, minimum_size=1024)

app.include_router(meta.router)
app.include_router(visuals.router)
app.include_router(sellers.router)
app.include_router(insights.router)


@app.get("/", tags=["meta"])
def root():
    """Tiny index so a browser hitting the base URL sees where to go."""
    return {
        "name": "Marketplace Delivery & Satisfaction API",
        "docs": "/docs",
        "dashboard_endpoint": "/api/dashboard",
        "health": "/api/health",
    }
