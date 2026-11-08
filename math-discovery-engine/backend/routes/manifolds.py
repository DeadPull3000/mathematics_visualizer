"""Manifold and Differential Geometry routes."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status

from models.manifolds import ManifoldRequest, ManifoldResponse
from services.manifolds import generate_manifold

log = logging.getLogger("math-engine.routes.manifolds")
router = APIRouter(tags=["Topology & Manifolds"])


@router.post(
    "/api/process-manifold",
    response_model=ManifoldResponse,
    summary="Generate 3D manifold mesh and harmonics",
    status_code=status.HTTP_200_OK,
)
async def process_manifold(payload: ManifoldRequest) -> ManifoldResponse:
    """Accepts a manifold shape and resolution to generate 3D mesh coordinates and invariants."""
    try:
        manifold_data = generate_manifold(
            shape=payload.shape,
            res=payload.resolution,
            deformation=payload.deformation,
            expr_x=payload.expr_x,
            expr_y=payload.expr_y,
            expr_z=payload.expr_z,
            u_min=payload.u_min,
            u_max=payload.u_max,
            v_min=payload.v_min,
            v_max=payload.v_max,
            deleted_nodes=payload.deleted_nodes,
        )
        return ManifoldResponse(**manifold_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        log.exception("Manifold generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Manifold generation error: {exc}",
        ) from exc
