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
from cache import math_cache, generate_cache_key
from starlette.responses import Response

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

    # Deterministic endpoints eligible for pure functional caching
    CACHED_PREFIXES = {
        "/api/process-object",
        "/api/process-knot",
        "/api/process-manifold",
        "/api/process-algebraic",
        "/api/process-circuit",
        "/api/process-tda",
        "/api/process-wl",
        "/api/process-oracle",
        "/api/narrate",
        "/api/gnn-inspect",
    }

    # Performance, Caching & Timing Middleware
    @app.middleware("http")
    async def add_process_time_and_cache(request: Request, call_next):
        """Pure functional caching and timing observability middleware."""
        t0 = time.perf_counter()
        path = request.url.path

        if request.method == "POST" and path in CACHED_PREFIXES:
            body = await request.body()
            key = generate_cache_key(path, body)
            cached_entry = math_cache.get(key)

            if cached_entry:
                elapsed_ms = (time.perf_counter() - t0) * 1000
                res = Response(
                    content=cached_entry["content"],
                    status_code=200,
                    media_type="application/json",
                )
                res.headers["X-Cache"] = "HIT"
                res.headers["X-Cache-Key"] = key[:12]
                res.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
                return res

            # Cache miss: compute and populate cache
            response = await call_next(request)
            if response.status_code == 200:
                if hasattr(response, "body"):
                    full_body = response.body
                elif hasattr(response, "body_iterator"):
                    chunks = [c async for c in response.body_iterator]
                    full_body = b"".join(chunks)
                else:
                    full_body = b""

                math_cache.set(key, {"content": full_body})
                elapsed_ms = (time.perf_counter() - t0) * 1000
                new_res = Response(
                    content=full_body,
                    status_code=200,
                    headers=dict(response.headers),
                    media_type=response.media_type or "application/json",
                )
                new_res.headers["X-Cache"] = "MISS"
                new_res.headers["X-Cache-Key"] = key[:12]
                new_res.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
                return new_res

            elapsed_ms = (time.perf_counter() - t0) * 1000
            response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
            return response

        # Non-cached routes
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
        return response

    # Mount unified API routes
    app.include_router(api_router)

    return app


app = create_app()
