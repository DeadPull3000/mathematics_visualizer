"""
Visual Mathematical Discovery Engine - FastAPI Backend (Step 2)
===============================================================
Main application entry point.  This revision replaces the mock computation
stubs with a real data-ingestion pipeline backed by networkx parsers.

Run with:
    uvicorn main:app --reload --port 8000

Endpoints:
    GET  /health                 -- Liveness probe + library versions
    POST /api/process-object     -- Parse raw input, compute graph invariants
"""

from __future__ import annotations

import logging
import time
from typing import Union

import networkx as nx
import numpy as np
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from models import GraphMetadata, MathRequest, MathResponse, KnotRequest, KnotResponse, ManifoldRequest, ManifoldResponse
from parsers import parse_edge_list, parse_formula, parse_json
from topology import compute_spectral_topology, compute_betti_numbers
from ml_engine import compute_gradient_saliency
from knot_theory import generate_torus_knot
from manifolds import generate_manifold
import re

# --- Logging ------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s -- %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("math-engine")

# --- Application bootstrap ----------------------------------------------------

app = FastAPI(
    title="Visual Mathematical Discovery Engine",
    description=(
        "Step 2: Data Ingestion & Representation Layer.\n\n"
        "Accepts raw user text (edge lists, graph formulae, or NetworkX JSON), "
        "parses it into a rigorously validated NetworkX graph object, and "
        "returns the 1-skeleton with computed topological invariants."
    ),
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS middleware -----------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request timing middleware -------------------------------------------------


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Inject X-Process-Time-Ms header on every response for monitoring."""
    t0 = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
    return response


# --- Parser dispatch table ----------------------------------------------------

_PARSERS = {
    "edge_list": parse_edge_list,
    "formula":   parse_formula,
    "json":      parse_json,
}

# --- Graph invariant computation ----------------------------------------------


def _compute_metadata(graph: nx.Graph) -> GraphMetadata:
    """
    Derive topological invariants from a validated NetworkX graph.

    This function computes the 1-skeleton metadata that will serve as
    the foundation for Simplicial Complex and Persistent Laplacian
    calculations in subsequent steps.

    Parameters
    ----------
    graph : nx.Graph
        A validated, undirected simple graph from one of the parsers.

    Returns
    -------
    GraphMetadata
        The computed invariants, ready for serialisation.

    Notes
    -----
    - Density is 0 for graphs with |V| <= 1 (undefined otherwise).
    - Connectivity is checked via BFS (O(|V| + |E|)).
    - Planarity test is skipped for |E| > 1,000 (returns None) to keep
      response times acceptable for medium-sized graphs.
    """
    n: int = graph.number_of_nodes()
    m: int = graph.number_of_edges()

    # Graph density: 2|E| / (|V|(|V|-1)); 0 for degenerate cases.
    density: float = nx.density(graph)  # handles edge cases internally

    # Connectivity and Betti-0
    is_connected: bool = nx.is_connected(graph) if n > 0 else False
    num_components: int = nx.number_connected_components(graph) if n > 0 else 0

    # Planarity -- Boyer-Myrvold test, skipped for large edge sets
    PLANARITY_EDGE_LIMIT = 1_000
    is_planar: Union[bool, None]
    if m <= PLANARITY_EDGE_LIMIT:
        is_planar, _ = nx.check_planarity(graph)
    else:
        is_planar = None
        log.info(
            "Planarity check skipped: |E| = %d > %d limit.",
            m,
            PLANARITY_EDGE_LIMIT,
        )

    return GraphMetadata(
        num_nodes=n,
        num_edges=m,
        density=round(density, 6),
        is_connected=is_connected,
        num_connected_components=num_components,
        is_planar=is_planar,
    )


# --- Routes -------------------------------------------------------------------


@app.get(
    "/health",
    summary="Health check",
    response_description="Service liveness and library versions",
    tags=["Meta"],
)
async def health_check() -> dict:
    """
    Simple liveness probe.

    Returns 200 when the service is running and all core libraries
    (networkx, numpy) are importable and version-queryable.
    """
    return {
        "status": "ok",
        "service": "math-discovery-engine",
        "version": app.version,
        "libraries": {
            "networkx": nx.__version__,
            "numpy": np.__version__,
        },
    }


@app.post(
    "/api/process-object",
    response_model=MathResponse,
    summary="Parse input and compute graph invariants",
    response_description="1-skeleton nodes, edges, and topological metadata",
    status_code=status.HTTP_200_OK,
    tags=["Core"],
)
async def process_object(payload: MathRequest) -> MathResponse:
    """
    Accept raw user input, parse it into a NetworkX graph, and return
    the computed 1-skeleton with topological invariants.

    ### Input types

    | input_type  | raw_data format                                          |
    |-------------|----------------------------------------------------------|
    | `edge_list` | One `u v` edge per line (space or comma separated)       |
    | `formula`   | `K_n`, `C_n`, or `P_n`                                   |
    | `json`      | NetworkX node-link JSON (`nx.node_link_data` format)     |

    ### Example request (edge list)
    ```json
    {
      "input_type": "edge_list",
      "raw_data": "0 1\\n1 2\\n2 3\\n3 0\\n0 2"
    }
    ```

    ### Example request (formula)
    ```json
    {
      "input_type": "formula",
      "raw_data": "K_5"
    }
    ```

    ### Error handling
    - **400 Bad Request** -- returned when the parser raises a ``ValueError``
      (malformed input, unrecognised formula, invalid JSON, or graph too large).
    - **422 Unprocessable Entity** -- returned by FastAPI when the request
      body itself does not conform to ``MathRequest`` (missing fields, wrong
      types).
    """
    log.info(
        "Request received: input_type=%r, raw_data_length=%d",
        payload.input_type,
        len(payload.raw_data),
    )

    # --- Parse ---
    parser = _PARSERS[payload.input_type]
    try:
        graph: nx.Graph = parser(payload.raw_data)
    except ValueError as exc:
        log.warning("Parse error for input_type=%r: %s", payload.input_type, exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    # --- Compute invariants ---
    try:
        metadata = _compute_metadata(graph)
        topology = compute_spectral_topology(graph)
        topology["betti_numbers"] = compute_betti_numbers(graph)
        topology["saliency_scores"] = compute_gradient_saliency(graph)
    except Exception as exc:
        log.exception("Invariant/topology computation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invariant/topology computation error: {exc}",
        ) from exc

    # --- Build response ---
    # Sort nodes for deterministic ordering (ints before strings, then by value)
    def _sort_key(node):
        return (0, node) if isinstance(node, int) else (1, str(node))

    sorted_nodes = sorted(graph.nodes(), key=_sort_key)
    edges_list = [[u, v] for u, v in graph.edges()]

    log.info(
        "Done: |V|=%d, |E|=%d, connected=%s, components=%d, planar=%s",
        metadata.num_nodes,
        metadata.num_edges,
        metadata.is_connected,
        metadata.num_connected_components,
        metadata.is_planar,
    )

    return MathResponse(
        nodes=sorted_nodes,
        edges=edges_list,
        metadata=metadata,
        topology=topology,
    )


@app.post(
    "/api/export-python",
    response_class=PlainTextResponse,
    summary="Export graph to a Python script",
    response_description="A runnable Python script reproducing the current graph",
    status_code=status.HTTP_200_OK,
    tags=["Export"],
)
async def export_python(payload: MathRequest) -> str:
    """
    Export the current parsed graph state to a runnable Python script.
    """
    parser = _PARSERS[payload.input_type]
    try:
        graph: nx.Graph = parser(payload.raw_data)
    except ValueError as exc:
        log.warning("Parse error in export_python: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    nodes_repr = repr(list(graph.nodes()))
    edges_repr = repr(list(graph.edges()))

    script = f'''import networkx as nx
import numpy as np
import scipy.linalg as la

# Generated by Visual Mathematical Discovery Engine
G = nx.Graph()
G.add_nodes_from({nodes_repr})
G.add_edges_from({edges_repr})

# Compute Laplacian
L = nx.laplacian_matrix(G).todense()
eigenvalues = la.eigvalsh(L)
print(f"Algebraic Connectivity: {{eigenvalues[1]:.4f}}")
'''
    return script


@app.post(
    "/api/process-knot",
    response_model=KnotResponse,
    summary="Generate 3D knot coordinates and invariants",
    status_code=status.HTTP_200_OK,
    tags=["Knot Theory"],
)
async def process_knot(payload: KnotRequest) -> KnotResponse:
    """
    Accepts a knot formula (e.g., T_3_2) and returns the 3D geometry and invariants.
    """
    formula = payload.formula.strip()
    match = re.match(r"^T_(\d+)_(\d+)$", formula, re.IGNORECASE)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported knot formula: {formula}. Expected format: T_p_q (e.g., T_3_2 for a Trefoil knot)."
        )
    
    p = int(match.group(1))
    q = int(match.group(2))
    
    if p < 1 or q < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Torus knot parameters p and q must be positive integers."
        )
    
    try:
        knot_data = generate_torus_knot(p, q)
        return KnotResponse(**knot_data)
    except Exception as exc:
        log.exception("Knot generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knot generation error: {exc}",
        ) from exc

@app.post(
    "/api/process-manifold",
    response_model=ManifoldResponse,
    summary="Generate 3D manifold mesh and harmonics",
    status_code=status.HTTP_200_OK,
    tags=["Topology"],
)
async def process_manifold(payload: ManifoldRequest) -> ManifoldResponse:
    """
    Accepts a manifold shape and resolution to generate 3D mesh coordinates and invariants.
    """
    try:
        manifold_data = generate_manifold(
            shape=payload.shape,
            res=payload.resolution,
            deformation=payload.deformation,
            expr_x=payload.expr_x,
            expr_y=payload.expr_y,
            expr_z=payload.expr_z,
            u_min=payload.u_min,
            u_max=payload.u_max,
            v_min=payload.v_min,
            v_max=payload.v_max,
        )
        return ManifoldResponse(**manifold_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc
    except Exception as exc:
        log.exception("Manifold generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Manifold generation error: {exc}",
        ) from exc

