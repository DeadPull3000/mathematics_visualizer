"""Conjecture Oracle routes using SVD Null Space."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status

from models.oracle import OracleRequest, OracleResponse
from services.oracle import discover_linear_laws

log = logging.getLogger("math-engine.routes.oracle")
router = APIRouter(tags=["Conjecture Oracle"])


@router.post(
    "/api/process-oracle",
    response_model=OracleResponse,
    summary="Discover linear relationships using SVD",
    status_code=status.HTTP_200_OK,
)
async def process_oracle(payload: OracleRequest) -> OracleResponse:
    """Discovers null space linear relationships among graph topological invariants."""
    try:
        conjectures = discover_linear_laws(payload.batch_data)
        return OracleResponse(conjectures=conjectures)
    except Exception as exc:
        log.exception("Oracle computation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Oracle computation error: {exc}",
        ) from exc
