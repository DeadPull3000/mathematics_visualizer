"""
Computation Cache Router (Phase 4)
==================================
Endpoints for inspecting cache hit ratios, sizing, and manual invalidation.
"""

from __future__ import annotations
from fastapi import APIRouter, status
from cache import math_cache

router = APIRouter(tags=["Computation Cache"])


@router.get(
    "/api/cache/stats",
    summary="Get calculation cache telemetry and hit ratio",
    status_code=status.HTTP_200_OK,
)
async def get_cache_stats() -> dict:
    """Returns real-time cache sizing, hit counts, miss counts, and hit ratio."""
    return math_cache.stats()


@router.post(
    "/api/cache/clear",
    summary="Purge all cached mathematical computations",
    status_code=status.HTTP_200_OK,
)
async def clear_cache() -> dict:
    """Flushes the entire LRU cache."""
    math_cache.clear()
    return {"status": "cleared", "timestamp": str(math_cache.stats())}
