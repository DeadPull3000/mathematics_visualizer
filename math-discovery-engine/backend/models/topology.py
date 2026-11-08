"""Pydantic models for spectral topology, graph ingestion, and invariants."""

from __future__ import annotations
from typing import Union
from pydantic import BaseModel, Field, field_validator
from .base import InputType


class MathRequest(BaseModel):
    """Payload sent to describe a mathematical object for graph ingestion."""
    input_type: InputType = Field(
        ...,
        description="Parsing strategy: 'edge_list' | 'formula' | 'json'",
        examples=["edge_list"],
    )
    raw_data: str = Field(
        ...,
        min_length=1,
        description="Raw string representation of the mathematical object",
        examples=["0 1\n1 2\n2 3\n3 0"],
    )

    @field_validator("raw_data")
    @classmethod
    def raw_data_not_blank(cls, v: str) -> str:
        """Reject whitespace-only strings that would trip the parsers."""
        if not v.strip():
            raise ValueError(
                "raw_data must not be blank or whitespace-only. "
                "Please enter a valid edge list, formula, or JSON object."
            )
        return v


class GraphMetadata(BaseModel):
    """Fundamental topological invariants derived from the parsed NetworkX graph."""
    num_nodes: int = Field(
        ...,
        ge=0,
        description="Cardinality of the vertex set |V|.",
    )
    num_edges: int = Field(
        ...,
        ge=0,
        description="Cardinality of the edge set |E|.",
    )
    density: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description=(
            "Graph density: 2|E| / (|V|(|V|-1)) in [0, 1]. "
            "0 = empty graph, 1 = complete graph."
        ),
    )
    is_connected: bool = Field(
        ...,
        description=(
            "True if every vertex is reachable from every other vertex "
            "via a path (i.e., beta_0 = 1)."
        ),
    )
    num_connected_components: int = Field(
        ...,
        ge=1,
        description=(
            "beta_0: the 0th Betti number -- number of path-connected components."
        ),
    )
    is_planar: Union[bool, None] = Field(
        default=None,
        description=(
            "True if the graph is planar (Boyer-Myrvold test). "
            "None if the test is skipped for graphs with > 1,000 edges."
        ),
    )


class TopologyMetadata(BaseModel):
    """Spectral and topological features computed from the graph's Laplacian and Simplicial Complex."""
    laplacian_eigenvalues: list[float] = Field(
        ...,
        description="Sorted eigenvalues of the Laplacian matrix.",
    )
    fiedler_vector: dict[Union[int, str], float] = Field(
        ...,
        description="Fiedler vector mapping node ID to its float value.",
    )
    algebraic_connectivity: float = Field(
        ...,
        description="Second smallest eigenvalue of the Laplacian (algebraic connectivity).",
    )
    betti_numbers: list[int] = Field(
        ...,
        description="Betti numbers (beta_0, beta_1, beta_2) of the Simplicial Clique Complex.",
    )
    saliency_scores: dict[Union[int, str], float] = Field(
        ...,
        description="Structural saliency scores mapping node ID to a float between 0.0 and 1.0.",
    )
    normalized_eigenvalues: list[float] = Field(
        default_factory=list,
        description="Sorted eigenvalues of the normalized Laplacian L_norm = D^{-1/2} L D^{-1/2}.",
    )
    spectral_gap: float = Field(
        0.0,
        description="Normalized spectral gap nu_1 (rate of convergence of random walk).",
    )
    cheeger_bounds: dict[str, float] = Field(
        default_factory=dict,
        description="Cheeger inequality conductance bounds: {'lower': ..., 'upper': ...}.",
    )
    heat_kernel_signatures: dict[str, dict[Union[int, str], float]] = Field(
        default_factory=dict,
        description="Multi-scale Heat Kernel Signatures at diffusion timescales t=0.1, t=1.0, t=10.0.",
    )
    h1_generators: list[list[Union[int, str]]] = Field(
        default_factory=list,
        description="Independent 1-cycle generators representing topological holes.",
    )
    triangles: list[list[Union[int, str]]] = Field(
        default_factory=list,
        description="2-simplices (triangles) forming the 2-skeleton of the clique complex.",
    )
    graph_family: dict[str, Union[bool, int, float, str, None]] = Field(
        default_factory=dict,
        description="Classification of graph family properties (is_tree, is_bipartite, is_eulerian, girth, etc.).",
    )


class MathResponse(BaseModel):
    """Standardised response returned after parsing and computing graph invariants."""
    nodes: list[Union[int, str]] = Field(
        ...,
        description="Sorted list of node identifiers (int or str).",
    )
    edges: list[list[Union[int, str]]] = Field(
        ...,
        description="Edge list as [[source, target], ...] pairs.",
    )
    metadata: GraphMetadata = Field(
        ...,
        description="Computed topological invariants of the graph.",
    )
    topology: TopologyMetadata = Field(
        ...,
        description="Spectral topological features (Laplacian).",
    )
