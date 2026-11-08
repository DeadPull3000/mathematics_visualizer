"""Knot Theory routes."""

from __future__ import annotations

import logging
import re
from fastapi import APIRouter, HTTPException, status

from models.knots import KnotRequest, KnotResponse
from services.knots import generate_torus_knot

log = logging.getLogger("math-engine.routes.knots")
router = APIRouter(tags=["Knot Theory"])


@router.post(
    "/api/process-knot",
    response_model=KnotResponse,
    summary="Generate 3D knot coordinates and invariants",
    status_code=status.HTTP_200_OK,
)
async def process_knot(payload: KnotRequest) -> KnotResponse:
    """Accepts a knot formula (e.g., T_3_2) and returns the 3D geometry and invariants."""
    formula = payload.formula.strip()
    match = re.match(r"^T_(\d+)_(\d+)$", formula, re.IGNORECASE)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported knot formula: {formula}. Expected format: T_p_q (e.g., T_3_2 for a Trefoil knot)."
        )
    
    p = int(match.group(1))
    q = int(match.group(2))
    
    if p < 1 or q < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Torus knot parameters p and q must be positive integers."
        )
    
    try:
        knot_data = generate_torus_knot(p, q)
        return KnotResponse(**knot_data)
    except Exception as exc:
        log.exception("Knot generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knot generation error: {exc}",
        ) from exc
