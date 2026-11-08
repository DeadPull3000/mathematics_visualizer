"""
Visual Mathematical Discovery Engine - FastAPI Application Factory
===================================================================
Constructs and configures the FastAPI application instance with middleware,
CORS policies, lifecycle events, and modular routes.
"""

from __future__ import annotations

import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import api_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s -- %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("math-engine")


def create_app() -> FastAPI:
    """Application factory for the Mathematical Discovery Engine backend."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.DESCRIPTION,
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Performance / Timing Middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        """Inject X-Process-Time-Ms header on every response for observability."""
        t0 = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
        return response

    # Mount unified API routes
    app.include_router(api_router)

    return app


app = create_app()
