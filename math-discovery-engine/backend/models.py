"""
Visual Mathematical Discovery Engine - Pydantic Schemas (Step 2)
================================================================
Defines the strict API contract between the FastAPI backend and the
Next.js frontend for the Data Ingestion & Representation Layer.

Classes
-------
MathRequest    - incoming payload describing the raw user input
GraphMetadata  - computed graph invariants (the 1-skeleton metadata)
MathResponse   - outgoing structured response sent back to the frontend
"""

from __future__ import annotations

from typing import Literal, Union

from pydantic import BaseModel, Field, field_validator

# --- Allowed input types ------------------------------------------------------

InputType = Literal["edge_list", "formula", "json"]

# --- Request ------------------------------------------------------------------


class MathRequest(BaseModel):
    """
    Payload sent by the frontend to describe a mathematical object.

    The frontend passes raw user text unmodified; all parsing is performed
    on the backend so that the frontend never needs to validate maths.

    Fields
    ------
    input_type : InputType
        How raw_data should be interpreted.

        "edge_list"
            One edge per line, nodes separated by whitespace or commas.
            Example: "0 1\n1 2\n2 3\n3 0"

        "formula"
            A graph-theoretic notation string.
            Supported: K_n (complete), C_n (cycle), P_n (path).
            Example: "K_5"

        "json"
            A JSON string in NetworkX node-link format, as produced by
            networkx.node_link_data(G).

    raw_data : str
        The raw string to be parsed.  Must not be blank.
    """

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


# --- Graph metadata / invariants ----------------------------------------------


class GraphMetadata(BaseModel):
    """
    Fundamental topological invariants derived from the parsed NetworkX graph.

    This is the 1-skeleton metadata -- the foundational data layer upon
    which future Simplicial Complex and Persistent Laplacian computations
    will be built in subsequent steps.

    Mathematical notes
    ------------------
    - density  = 2|E| / (|V| * (|V| - 1))  for a simple undirected graph.
      For |V| <= 1 the density is defined as 0.
    - is_connected is True iff there is a path between every pair of
      vertices (equivalently, the 0th Betti number beta_0 = 1).
    - num_connected_components equals beta_0, the 0th Betti number.
    - is_planar is computed via the Boyer-Myrvold planarity test
      (O(|V|) time) and is set to None for very large graphs.
    """

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
            "beta_0: the 0th Betti number -- number of path-connected "
            "components of the graph."
        ),
    )
    is_planar: Union[bool, None] = Field(
        default=None,
        description=(
            "True if the graph is planar (Boyer-Myrvold test). "
            "None if the test is skipped for graphs with > 1,000 edges."
        ),
    )


# --- Response -----------------------------------------------------------------


class TopologyMetadata(BaseModel):
    """
    Spectral and topological features computed from the graph's Laplacian.
    """
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


class MathResponse(BaseModel):
    """
    Standardised response returned to the frontend after parsing and
    computing graph invariants.

    The nodes and edges fields carry the 1-skeleton of the underlying
    simplicial complex in a format that frontend visualisation libraries
    (D3.js, Three.js, Cytoscape) can consume directly.

    Fields
    ------
    nodes : list[int | str]
        Sorted list of node identifiers from the parsed graph.

    edges : list[list[int | str]]
        List of [source, target] pairs.

    metadata : GraphMetadata
        The computed topological invariants of the 1-skeleton.
        
    topology : TopologyMetadata
        Spectral graph theory metrics (Laplacian eigenvalues, Fiedler vector).
    """

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


class KnotRequest(BaseModel):
    """Payload for Knot Theory computations."""
    formula: str = Field(..., description="Knot formula, e.g., T_3_2")


class KnotResponse(BaseModel):
    """Response containing 3D coordinates and topological invariants of a knot."""
    nodes: list[dict] = Field(..., description="List of nodes with id, fx, fy, fz")
    edges: list[list[int]] = Field(..., description="List of [source, target] edge pairs")
    invariants: dict = Field(..., description="Knot invariants (crossing_number, p, q, type, writhe)")
    saliency_scores: dict[Union[int, str], float] = Field(..., description="Local entanglement saliency scores mapping node ID to [0.0, 1.0].")

class ManifoldRequest(BaseModel):
    """Payload for Manifold computations."""
    shape: str = Field(..., description="Manifold shape, e.g., 'Sphere' or 'Torus'")
    resolution: int = Field(15, description="Resolution of the parametric grid")

class ManifoldResponse(BaseModel):
    """Response containing 3D coordinates and invariants of a manifold mesh."""
    nodes: list[dict] = Field(..., description="List of nodes with id, fx, fy, fz")
    edges: list[list[Union[int, str]]] = Field(..., description="List of [source, target] edge pairs")
    invariants: dict = Field(..., description="Manifold invariants (vertices, edges, euler_characteristic)")
    harmonics: dict[Union[int, str], float] = Field(..., description="2nd non-zero eigenvector of the Combinatorial Laplacian")
