"""Conjecture Oracle routes using SVD Null Space."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status

from models.oracle import OracleRequest, OracleResponse
from services.oracle import discover_all_laws

log = logging.getLogger("math-engine.routes.oracle")
router = APIRouter(tags=["Conjecture Oracle"])


@router.post(
    "/api/process-oracle",
    response_model=OracleResponse,
    summary="Discover linear and non-linear relationships using SVD Null-Space",
    status_code=status.HTTP_200_OK,
)
async def process_oracle(payload: OracleRequest) -> OracleResponse:
    """Discovers null space linear and polynomial relationships and flags batch anomalies."""
    try:
        discovery = discover_all_laws(payload.batch_data)
        return OracleResponse(
            conjectures=discovery["conjectures"],
            linear_conjectures=discovery["linear_conjectures"],
            polynomial_conjectures=discovery["polynomial_conjectures"],
            anomalies=discovery["anomalies"],
        )
    except Exception as exc:
        log.exception("Oracle computation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Oracle computation error: {exc}",
        ) from exc
