"""
Mathematical Narrator Router ("Professor's Notes") (Phase 3)
=============================================================
Provides endpoint POST /api/narrate delivering deep academic commentary
and theorem deconstruction for computed invariants.
"""

from __future__ import annotations
import logging
from fastapi import APIRouter, HTTPException, status

from models.narrator import NarratorRequest, NarratorResponse
from services.narrator import generate_narrative

log = logging.getLogger("math-engine.routes.narrator")
router = APIRouter(tags=["Mathematical Narrator"])


@router.post(
    "/api/narrate",
    response_model=NarratorResponse,
    summary="Generate academic mathematical commentary",
    status_code=status.HTTP_200_OK,
)
async def narrate_mathematics(payload: NarratorRequest) -> NarratorResponse:
    """Generates structured professor notes, theoretical connections, and open research questions."""
    try:
        response = generate_narrative(
            domain=payload.domain,
            invariants=payload.invariants,
            formula=payload.formula,
        )
        return response
    except Exception as exc:
        log.exception("Narrator generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mathematical narrator error: {exc}",
        ) from exc
