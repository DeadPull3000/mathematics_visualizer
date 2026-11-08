"""Pydantic models for Weisfeiler-Lehman Graph Isomorphism Testing."""

from __future__ import annotations
from typing import Union
from pydantic import BaseModel, Field


class WLRequest(BaseModel):
    """Payload for Weisfeiler-Lehman Isomorphism Test."""
    formula1: str = Field(..., description="First graph formula or edge list")
    formula2: str = Field(..., description="Second graph formula or edge list")


class WLResponse(BaseModel):
    """Response containing two graphs and their WL color steps."""
    graph1_nodes: list[dict] = Field(..., description="List of nodes for Graph 1 with id, fx, fy, fz optional")
    graph1_edges: list[list[Union[int, str]]] = Field(..., description="List of edges for Graph 1")
    graph2_nodes: list[dict] = Field(..., description="List of nodes for Graph 2 with id, fx, fy, fz optional")
    graph2_edges: list[list[Union[int, str]]] = Field(..., description="List of edges for Graph 2")
    wl_steps1: list[dict[Union[int, str], int]] = Field(..., description="WL color evolution for Graph 1")
    wl_steps2: list[dict[Union[int, str], int]] = Field(..., description="WL color evolution for Graph 2")
    is_isomorphic: bool = Field(..., description="Whether the graphs are isomorphic according to the WL test")
