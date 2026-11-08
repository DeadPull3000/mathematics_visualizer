"""
Pydantic models for GNN Architecture Playground (Phase 3)
=========================================================
"""

from __future__ import annotations
from typing import Any, Dict, List, Union
from pydantic import BaseModel, Field


class GNNInspectRequest(BaseModel):
    """Payload to inspect GNN internal representations, attention weights, and saliency."""
    model_config = {"protected_namespaces": ()}
    nodes: List[Union[int, str]] = Field(..., description="List of graph node IDs")
    edges: List[List[Union[int, str]]] = Field(..., description="List of [source, target] edge pairs")
    model_type: str = Field("GCN", description="GNN architecture: 'GCN' | 'GAT' | 'GraphSAGE'")


class GNNInspectResponse(BaseModel):
    """GNN representations including attention coefficients and projected hidden embeddings."""
    model_config = {"protected_namespaces": ()}
    model_type: str = Field(..., description="Inspected model architecture name")
    saliency_scores: Dict[Union[int, str], float] = Field(..., description="Node saliency gradients [0, 1]")
    attention_weights: List[Dict[str, Any]] = Field(default_factory=list, description="Attention coefficients per directed edge")
    embeddings_2d: Dict[Union[int, str], List[float]] = Field(default_factory=dict, description="2D PCA projection of hidden layer embeddings")
