"""Weisfeiler-Lehman Graph Isomorphism routes."""

from __future__ import annotations

import logging
from typing import Dict, Callable
import networkx as nx
from fastapi import APIRouter, HTTPException, status

from models.wl import WLRequest, WLResponse
from parsers import parse_edge_list, parse_formula
from services.wl import compute_wl_test

log = logging.getLogger("math-engine.routes.wl")
router = APIRouter(tags=["Graph Theory"])


def _parse_graph(text: str) -> nx.Graph:
    try:
        return parse_formula(text)
    except Exception:
        try:
            return parse_edge_list(text)
        except Exception as e:
            raise ValueError(f"Could not parse as formula or edge list: {text}") from e


@router.post(
    "/api/process-wl",
    response_model=WLResponse,
    summary="Compute 1-Weisfeiler-Lehman Test",
    status_code=status.HTTP_200_OK,
)
async def process_wl(payload: WLRequest) -> WLResponse:
    """
    Accepts two graphs (formula or edge list), computes WL coloring steps, and
    determines if they are possibly isomorphic.
    """
    try:
        g1 = _parse_graph(payload.formula1)
        g2 = _parse_graph(payload.formula2)
        
        steps1, steps2, is_isomorphic = compute_wl_test(g1, g2)
        
        nodes1 = [{"id": n} for n in g1.nodes()]
        edges1 = [[u, v] for u, v in g1.edges()]
        
        nodes2 = [{"id": n} for n in g2.nodes()]
        edges2 = [[u, v] for u, v in g2.edges()]
        
        return WLResponse(
            graph1_nodes=nodes1,
            graph1_edges=edges1,
            graph2_nodes=nodes2,
            graph2_edges=edges2,
            wl_steps1=steps1,
            wl_steps2=steps2,
            is_isomorphic=is_isomorphic,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        log.exception("WL computation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"WL computation error: {exc}",
        ) from exc
