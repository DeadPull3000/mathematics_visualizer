"""
Routes Aggregator
=================
Consolidates all modular mathematical domain routers.
"""

from fastapi import APIRouter

from .health import router as health_router
from .topology import router as topology_router
from .knots import router as knots_router
from .manifolds import router as manifolds_router
from .circuits import router as circuits_router
from .algebraic import router as algebraic_router
from .batch import router as batch_router
from .tda import router as tda_router
from .wl import router as wl_router
from .oracle import router as oracle_router
from .narrator import router as narrator_router
from .gnn import router as gnn_router
from .cache import router as cache_router

api_router = APIRouter()

# Include health routes at root
api_router.include_router(health_router)

# Include domain routes
api_router.include_router(topology_router)
api_router.include_router(knots_router)
api_router.include_router(manifolds_router)
api_router.include_router(circuits_router)
api_router.include_router(algebraic_router)
api_router.include_router(batch_router)
api_router.include_router(tda_router)
api_router.include_router(wl_router)
api_router.include_router(oracle_router)
api_router.include_router(narrator_router)
api_router.include_router(gnn_router)
api_router.include_router(cache_router)

__all__ = ["api_router"]
