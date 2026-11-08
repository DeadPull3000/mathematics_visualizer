"""Topology and Graph Theory routes."""

from __future__ import annotations

import logging
from typing import Dict, Callable
import networkx as nx
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import PlainTextResponse

from models.topology import MathRequest, MathResponse
from parsers import parse_edge_list, parse_formula, parse_json
from services.topology import (
    compute_metadata,
    compute_full_topology,
    generate_python_export,
)
from config import settings

log = logging.getLogger("math-engine.routes.topology")
router = APIRouter(tags=["Topology & Graph Theory"])

_PARSERS: Dict[str, Callable[[str], nx.Graph]] = {
    "edge_list": parse_edge_list,
    "formula": parse_formula,
    "json": parse_json,
}


@router.post(
    "/api/process-object",
    response_model=MathResponse,
    summary="Parse input and compute graph invariants",
    response_description="1-skeleton nodes, edges, and topological metadata",
    status_code=status.HTTP_200_OK,
)
async def process_object(payload: MathRequest) -> MathResponse:
    """
    Accept raw user input, parse it into a NetworkX graph, and return
    the computed 1-skeleton with topological invariants.
    """
    log.info(
        "Request received: input_type=%r, raw_data_length=%d",
        payload.input_type,
        len(payload.raw_data),
    )

    parser = _PARSERS.get(payload.input_type)
    if not parser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown input_type: {payload.input_type}",
        )

    try:
        graph: nx.Graph = parser(payload.raw_data)
    except ValueError as exc:
        log.warning("Parse error for input_type=%r: %s", payload.input_type, exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    try:
        metadata = compute_metadata(graph, planarity_limit=settings.PLANARITY_EDGE_LIMIT)
        topology = compute_full_topology(graph)
    except Exception as exc:
        log.exception("Invariant/topology computation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invariant/topology computation error: {exc}",
        ) from exc

    def _sort_key(node):
        return (0, node) if isinstance(node, int) else (1, str(node))

    sorted_nodes = sorted(graph.nodes(), key=_sort_key)
    edges_list = [[u, v] for u, v in graph.edges()]

    return MathResponse(
        nodes=sorted_nodes,
        edges=edges_list,
        metadata=metadata,
        topology=topology,
    )


@router.post(
    "/api/export-python",
    response_class=PlainTextResponse,
    summary="Export graph to a Python script",
    response_description="A runnable Python script reproducing the current graph",
    status_code=status.HTTP_200_OK,
    tags=["Export"],
)
async def export_python(payload: MathRequest) -> str:
    """Export the current parsed graph state to a runnable Python script."""
    parser = _PARSERS.get(payload.input_type)
    if not parser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown input_type: {payload.input_type}",
        )

    try:
        graph: nx.Graph = parser(payload.raw_data)
    except ValueError as exc:
        log.warning("Parse error in export_python: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return generate_python_export(graph)
