"""Algebraic Geometry & Exact Symbolic Computation routes."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status

from models.algebraic import AlgebraicRequest, AlgebraicResponse
from services.algebraic import generate_algebraic_variety

log = logging.getLogger("math-engine.routes.algebraic")
router = APIRouter(tags=["Algebraic Geometry"])


@router.post(
    "/api/process-algebraic",
    response_model=AlgebraicResponse,
    summary="Parse implicit algebraic equation and extract marching cubes isosurface",
    status_code=status.HTTP_200_OK,
)
async def process_algebraic(payload: AlgebraicRequest) -> AlgebraicResponse:
    """
    Accepts an implicit polynomial formula string, evaluates it over a 3D grid,
    extracts the zero-level isosurface, and computes exact symbolic singularities.
    """
    try:
        data = generate_algebraic_variety(
            formula=payload.formula,
            res=payload.resolution,
            bounds=payload.bounds,
            parameter_t=payload.parameter_t,
        )
        return AlgebraicResponse(**data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        log.exception("Algebraic geometry extraction failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Algebraic geometry extraction error: {exc}",
        ) from exc
