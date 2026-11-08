"""
GNN Playground Router (Phase 3)
===============================
Provides POST /api/gnn-inspect endpoint comparing GCN, GAT, and GraphSAGE architectures.
"""

from __future__ import annotations
import logging
import networkx as nx
from fastapi import APIRouter, HTTPException, status

from models.gnn import GNNInspectRequest, GNNInspectResponse
from ml_engine import compute_gnn_comparison

log = logging.getLogger("math-engine.routes.gnn")
router = APIRouter(tags=["GNN Playground"])


@router.post(
    "/api/gnn-inspect",
    response_model=GNNInspectResponse,
    summary="Inspect GNN representations, attention weights, and saliency",
    status_code=status.HTTP_200_OK,
)
async def inspect_gnn_architecture(payload: GNNInspectRequest) -> GNNInspectResponse:
    """Inspects GNN hidden states, attention weights (for GAT), and node gradient saliency."""
    try:
        G = nx.Graph()
        G.add_nodes_from(payload.nodes)
        for edge in payload.edges:
            if len(edge) >= 2:
                G.add_edge(edge[0], edge[1])

        result = compute_gnn_comparison(G, model_type=payload.model_type)
        return GNNInspectResponse(
            model_type=result["model_type"],
            saliency_scores=result["saliency_scores"],
            attention_weights=result["attention_weights"],
            embeddings_2d=result["embeddings_2d"],
        )
    except Exception as exc:
        log.exception("GNN inspection failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GNN inspection failed: {exc}",
        ) from exc
