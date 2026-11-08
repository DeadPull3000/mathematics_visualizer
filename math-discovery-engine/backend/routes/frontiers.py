"""
Mathematical Frontiers Router
=============================
Exposes endpoints for:
- Ihara Zeta Function & Graph Riemann Hypothesis verification
- Discrete Ollivier-Ricci Curvature & Bottleneck detection
- Tropical Geometry, Newton Polygons & Pick's Theorem genus
"""

from __future__ import annotations
import logging
from typing import Dict, Callable
import networkx as nx
from fastapi import APIRouter, HTTPException, status

from models.frontiers import (
    IharaRequest,
    IharaResponse,
    RicciRequest,
    RicciResponse,
    TropicalRequest,
    TropicalResponse,
)
from parsers import parse_edge_list, parse_formula, parse_json
from services.ihara import compute_ihara_zeta
from services.ricci import compute_ollivier_ricci
from services.tropical import analyze_tropical_curve

log = logging.getLogger("math-engine.routes.frontiers")
router = APIRouter(prefix="/api/frontiers", tags=["Mathematical Frontiers"])

_PARSERS: Dict[str, Callable[[str], nx.Graph]] = {
    "edge_list": parse_edge_list,
    "formula": parse_formula,
    "json": parse_json,
}


@router.post(
    "/ihara",
    response_model=IharaResponse,
    summary="Compute Ihara Zeta function, Bass determinant, and Ramanujan certificate",
)
async def get_ihara_zeta(payload: IharaRequest) -> IharaResponse:
    parser = _PARSERS.get(payload.input_type, parse_edge_list)
    try:
        graph = parser(payload.raw_data)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Graph parsing failed: {exc}",
        )

    try:
        result = compute_ihara_zeta(graph)
        return IharaResponse(**result)
    except Exception as exc:
        log.error(f"Error computing Ihara zeta: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Computation failed: {exc}",
        )


@router.post(
    "/ricci",
    response_model=RicciResponse,
    summary="Compute discrete Ollivier-Ricci curvature on graph edges",
)
async def get_ollivier_ricci(payload: RicciRequest) -> RicciResponse:
    parser = _PARSERS.get(payload.input_type, parse_edge_list)
    try:
        graph = parser(payload.raw_data)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Graph parsing failed: {exc}",
        )

    try:
        result = compute_ollivier_ricci(graph, alpha=payload.alpha)
        return RicciResponse(**result)
    except Exception as exc:
        log.error(f"Error computing Ricci curvature: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Computation failed: {exc}",
        )


@router.post(
    "/tropical",
    response_model=TropicalResponse,
    summary="Analyze algebraic curve via Newton polygon and tropical corner locus",
)
async def get_tropical_analysis(payload: TropicalRequest) -> TropicalResponse:
    try:
        result = analyze_tropical_curve(payload.formula)
        return TropicalResponse(**result)
    except Exception as exc:
        log.error(f"Error computing tropical curve: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Computation failed: {exc}",
        )
