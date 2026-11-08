"""Complexity Theory & Boolean Circuit routes."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status

from models.circuits import CircuitRequest, CircuitResponse
from services.circuits import parse_boolean_circuit

log = logging.getLogger("math-engine.routes.circuits")
router = APIRouter(tags=["Complexity"])


@router.post(
    "/api/process-circuit",
    response_model=CircuitResponse,
    summary="Parse boolean formula and compute circuit depth/critical path",
    status_code=status.HTTP_200_OK,
)
async def process_circuit(payload: CircuitRequest) -> CircuitResponse:
    """
    Accepts a boolean formula string, parses it into a DAG, and returns the circuit
    invariants including depth (longest path) and saliency map (critical path).
    """
    try:
        circuit_data = parse_boolean_circuit(payload.formula)
        return CircuitResponse(**circuit_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        log.exception("Circuit generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Circuit generation error: {exc}",
        ) from exc
