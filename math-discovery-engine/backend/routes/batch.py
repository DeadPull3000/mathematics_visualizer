"""Batch Dataset Explorer routes."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status

from models.batch import BatchRequest, BatchResponse
from services.batch import generate_batch_data

log = logging.getLogger("math-engine.routes.batch")
router = APIRouter(tags=["Batch Dataset Explorer"])


@router.post(
    "/api/process-batch",
    response_model=BatchResponse,
    summary="Generate a batch of random graphs and invariants",
    status_code=status.HTTP_200_OK,
)
async def process_batch(payload: BatchRequest) -> BatchResponse:
    """Generate a random dataset of Erdos-Renyi graphs with topological invariants."""
    try:
        data = generate_batch_data(payload.num_samples)
        return BatchResponse(data=data)
    except Exception as exc:
        log.exception("Batch generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch generation error: {exc}",
        ) from exc
