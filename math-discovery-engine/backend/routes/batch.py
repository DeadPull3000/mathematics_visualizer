"""
Batch Dataset Explorer Routes & Server-Sent Events (SSE) (Phase 4)
==================================================================
Provides synchronous batch evaluation and real-time incremental SSE streaming.
"""

from __future__ import annotations
import asyncio
import json
import logging
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from models.batch import BatchRequest, BatchResponse
from services.batch import generate_batch_data, generate_single_sample

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


@router.get(
    "/api/stream-batch",
    summary="Stream random graph evaluations progressively via Server-Sent Events",
    response_class=StreamingResponse,
    status_code=status.HTTP_200_OK,
)
async def stream_batch(
    num_samples: int = Query(default=100, ge=5, le=500, description="Total number of graphs to generate and stream"),
) -> StreamingResponse:
    """Streams evaluated graph invariant vectors one-by-one via Server-Sent Events (SSE)."""
    async def sse_event_stream():
        try:
            for idx in range(num_samples):
                # Generate sample
                sample = generate_single_sample(idx)
                payload = json.dumps({
                    "current": idx + 1,
                    "total": num_samples,
                    "sample": sample,
                })
                yield f"data: {payload}\n\n"
                # Gentle asynchronous pause for progressive render cadence
                await asyncio.sleep(0.008)

            yield f"event: complete\ndata: {json.dumps({'status': 'complete', 'total': num_samples})}\n\n"
        except asyncio.CancelledError:
            log.info("Batch streaming client disconnected at sample %d", idx)
        except Exception as exc:
            log.exception("Streaming batch error: %s", exc)
            yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
