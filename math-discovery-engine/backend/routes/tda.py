"""Topological Data Analysis & Persistent Homology routes."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status

from models.tda import TDARequest, TDAResponse
from services.tda import process_tda

log = logging.getLogger("math-engine.routes.tda")
router = APIRouter(tags=["Persistent Homology"])


@router.post(
    "/api/process-tda",
    response_model=TDAResponse,
    summary="Compute persistent homology for a 3D point cloud",
    status_code=status.HTTP_200_OK,
)
async def api_process_tda(payload: TDARequest) -> TDAResponse:
    """Accepts point cloud generation parameters and computes persistent homology barcodes."""
    try:
        data = process_tda(payload)
        return TDAResponse(**data) if isinstance(data, dict) else data
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        log.exception("TDA computation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TDA computation error: {exc}",
        ) from exc
