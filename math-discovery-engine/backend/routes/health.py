"""Health check and diagnostics route."""

import networkx as nx
import numpy as np
from fastapi import APIRouter
from config import settings

router = APIRouter(tags=["Meta"])


@router.get(
    "/health",
    summary="Health check",
    response_description="Service liveness and library versions",
)
async def health_check() -> dict:
    """
    Simple liveness probe.
    Returns 200 when the service is running and core libraries are available.
    """
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "libraries": {
            "networkx": nx.__version__,
            "numpy": np.__version__,
        },
    }
