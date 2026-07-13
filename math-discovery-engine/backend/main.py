"""
Visual Mathematical Discovery Engine — FastAPI Backend
=======================================================
Main application entry point.

Run with:
    uvicorn main:app --reload --port 8000

Endpoints:
    GET  /health                  — Liveness probe
    POST /api/process-object      — Compute invariants for a mathematical object
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

import networkx as nx
import numpy as np
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("math-engine")

# ─────────────────────────────────────────────────────────────────────────────
# Application bootstrap
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Visual Mathematical Discovery Engine",
    description=(
        "Computes topological and geometric invariants for mathematical objects "
        "(graphs, knots, Boolean circuits) and returns structured data for "
        "frontend visualisation."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────────────────────────────────────
# CORS — allow the Next.js dev server on localhost:3000
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Request / Response schemas
# ─────────────────────────────────────────────────────────────────────────────


class ProcessObjectRequest(BaseModel):
    """Payload sent by the frontend to describe a mathematical object."""

    type: str = Field(
        ...,
        description="Object category: 'graph' | 'knot' | 'circuit'",
        examples=["graph"],
    )
    data: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Domain-specific representation. "
            "For graphs: {nodes: [...], edges: [[u,v], ...]}"
        ),
    )
    parameters: dict[str, Any] = Field(
        default_factory=dict,
        description="Advanced tuning parameters (filtration radius, GNN layers, …)",
    )


class NodePayload(BaseModel):
    id: str
    label: str
    x: float
    y: float
    z: float
    weight: float
    group: str


class EdgePayload(BaseModel):
    source: str
    target: str
    weight: float


class InvariantPayload(BaseModel):
    name: str
    value: Any
    description: str


class ProcessObjectResponse(BaseModel):
    request_id: str
    status: str
    object_type: str
    nodes: list[NodePayload]
    edges: list[EdgePayload]
    invariants: list[InvariantPayload]
    computation_time_ms: float
    message: str


# ─────────────────────────────────────────────────────────────────────────────
# Middleware — request timing
# ─────────────────────────────────────────────────────────────────────────────


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time-Ms"] = f"{elapsed:.2f}"
    return response


# ─────────────────────────────────────────────────────────────────────────────
# Mock computation helpers
# ─────────────────────────────────────────────────────────────────────────────

_RNG = np.random.default_rng(seed=42)


def _mock_graph_invariants(data: dict) -> tuple[list, list, list]:
    """
    Build a small Petersen-like graph in NetworkX, compute real invariants,
    and return node / edge / invariant payloads.

    In later steps this will be replaced by actual computation.
    """
    # If the caller supplied their own edge list, use it; otherwise default
    raw_edges: list[list[int]] = data.get("edges", [])
    raw_nodes: list[Any] = data.get("nodes", [])

    if raw_edges:
        G = nx.Graph()
        G.add_nodes_from(raw_nodes if raw_nodes else range(max(max(e) for e in raw_edges) + 1))
        G.add_edges_from(raw_edges)
    else:
        # Default: Petersen graph — a classic test case in graph theory
        G = nx.petersen_graph()

    # ── Real NetworkX invariants ─────────────────────────────────────────────
    num_nodes = G.number_of_nodes()
    num_edges = G.number_of_edges()

    # Layout using spring embedding (good starting point for 3-D projection)
    pos_2d: dict = nx.spring_layout(G, seed=42, k=1.5)

    # Build 3-D positions by projecting the 2-D layout + a random z
    z_coords = _RNG.uniform(-0.5, 0.5, size=num_nodes)

    nodes: list[NodePayload] = []
    for i, n in enumerate(G.nodes()):
        deg = G.degree(n)
        nodes.append(
            NodePayload(
                id=str(n),
                label=f"v{n}",
                x=float(pos_2d[n][0]),
                y=float(pos_2d[n][1]),
                z=float(z_coords[i]),
                weight=float(deg) / max(dict(G.degree()).values()),
                group="core" if deg >= 3 else "peripheral",
            )
        )

    edges: list[EdgePayload] = [
        EdgePayload(
            source=str(u),
            target=str(v),
            weight=float(_RNG.uniform(0.2, 1.0)),
        )
        for u, v in G.edges()
    ]

    # ── Topological / Graph Invariants ───────────────────────────────────────
    chromatic_bound = max(nx.core_number(G).values()) + 1
    is_connected = nx.is_connected(G)
    diameter = nx.diameter(G) if is_connected else None
    clustering = nx.average_clustering(G)
    components = nx.number_connected_components(G)
    euler_char = num_nodes - num_edges  # V - E (genus-0 approximation)

    betti_0 = components
    # Approximate Betti-1 via Euler characteristic for planar embedding
    betti_1 = num_edges - num_nodes + components

    invariants: list[InvariantPayload] = [
        InvariantPayload(name="Vertices |V|", value=num_nodes, description="Cardinality of the vertex set"),
        InvariantPayload(name="Edges |E|", value=num_edges, description="Cardinality of the edge set"),
        InvariantPayload(name="Connected", value=is_connected, description="Is the graph connected?"),
        InvariantPayload(name="Components", value=components, description="Number of connected components (β₀)"),
        InvariantPayload(name="Diameter", value=diameter, description="Maximum shortest path length"),
        InvariantPayload(name="Avg Clustering", value=round(clustering, 4), description="Average clustering coefficient"),
        InvariantPayload(name="Chromatic Bound", value=chromatic_bound, description="Upper bound on chromatic number via degeneracy"),
        InvariantPayload(name="Euler Char χ", value=euler_char, description="V − E (Euler characteristic)"),
        InvariantPayload(name="β₀ (Betti-0)", value=betti_0, description="Number of connected components"),
        InvariantPayload(name="β₁ (Betti-1)", value=betti_1, description="Approximate cycle rank / first Betti number"),
    ]

    return nodes, edges, invariants


def _mock_knot_invariants(data: dict) -> tuple[list, list, list]:
    """Stub for knot / link data. Returns a trefoil-like mock."""
    # Trefoil knot as a sequence of crossing signs
    crossings = data.get("crossings", [1, -1, 1, -1, 1, -1])
    writhe = sum(crossings)
    bridge_number = 2  # trefoil is a 2-bridge knot

    nodes = [
        NodePayload(id=str(i), label=f"c{i}", x=float(_RNG.uniform(-1, 1)),
                    y=float(_RNG.uniform(-1, 1)), z=float(_RNG.uniform(-0.2, 0.2)),
                    weight=abs(float(crossings[i % len(crossings)])), group="crossing")
        for i in range(len(crossings))
    ]
    edges = [
        EdgePayload(source=str(i), target=str((i + 1) % len(crossings)), weight=1.0)
        for i in range(len(crossings))
    ]
    invariants = [
        InvariantPayload(name="Crossing Number", value=len(crossings), description="Minimum number of crossings"),
        InvariantPayload(name="Writhe", value=writhe, description="Algebraic crossing number"),
        InvariantPayload(name="Bridge Number", value=bridge_number, description="Minimum number of bridges"),
        InvariantPayload(name="Alexander Poly", value="t - 1 + t⁻¹", description="Alexander polynomial (mock)"),
    ]
    return nodes, edges, invariants


def _mock_circuit_invariants(data: dict) -> tuple[list, list, list]:
    """Stub for Boolean circuit data. Returns a mock DAG."""
    gates: list[str] = data.get("gates", ["AND", "OR", "NOT", "AND", "XOR"])
    G = nx.DiGraph()
    G.add_nodes_from(range(len(gates)))
    for i in range(len(gates) - 1):
        G.add_edge(i, i + 1)
    if len(gates) > 2:
        G.add_edge(0, len(gates) - 1)  # a skip connection

    pos = nx.spring_layout(G, seed=7)
    nodes = [
        NodePayload(id=str(n), label=gates[n], x=float(pos[n][0]), y=float(pos[n][1]),
                    z=0.0, weight=float(G.out_degree(n)) / max(1, len(gates)),
                    group=gates[n])
        for n in G.nodes()
    ]
    edges = [
        EdgePayload(source=str(u), target=str(v), weight=1.0)
        for u, v in G.edges()
    ]
    depth = nx.dag_longest_path_length(G)
    invariants = [
        InvariantPayload(name="Gate Count", value=len(gates), description="Total number of gates"),
        InvariantPayload(name="Circuit Depth", value=depth, description="Critical path length"),
        InvariantPayload(name="Width", value=len(gates) - depth, description="Approximate parallel width"),
        InvariantPayload(name="Is DAG", value=nx.is_directed_acyclic_graph(G), description="Acyclicity check"),
    ]
    return nodes, edges, invariants


_DISPATCHER = {
    "graph": _mock_graph_invariants,
    "knot": _mock_knot_invariants,
    "circuit": _mock_circuit_invariants,
}

# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────


@app.get(
    "/health",
    summary="Health check",
    response_description="Service liveness",
    tags=["Meta"],
)
async def health_check():
    """
    Simple liveness probe.

    Returns 200 when the service is running and all core libraries are
    importable (networkx, numpy).
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
    response_model=ProcessObjectResponse,
    summary="Process a mathematical object",
    response_description="Computed invariants and graph layout",
    status_code=status.HTTP_200_OK,
    tags=["Core"],
)
async def process_object(payload: ProcessObjectRequest) -> ProcessObjectResponse:
    """
    Accept a mathematical object description and return computed invariants.

    ### Supported object types
    | type      | Description                        |
    |-----------|------------------------------------|
    | `graph`   | Undirected/directed graph via edge list |
    | `knot`    | Knot or link via crossing sequence |
    | `circuit` | Boolean circuit via gate list      |

    ### Example payload
    ```json
    {
      "type": "graph",
      "data": {
        "nodes": [0, 1, 2, 3],
        "edges": [[0,1],[1,2],[2,3],[3,0],[0,2]]
      },
      "parameters": {
        "max_filtration_radius": 1.5,
        "gnn_layers": 3
      }
    }
    ```
    """
    t0 = time.perf_counter()

    object_type = payload.type.lower().strip()
    log.info("Processing object of type=%r with parameters=%s", object_type, payload.parameters)

    if object_type not in _DISPATCHER:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Unknown object type '{object_type}'. "
                f"Supported types: {sorted(_DISPATCHER.keys())}"
            ),
        )

    try:
        compute_fn = _DISPATCHER[object_type]
        nodes, edges, invariants = compute_fn(payload.data)
    except Exception as exc:
        log.exception("Computation failed for type=%r: %s", object_type, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Computation error: {exc}",
        ) from exc

    elapsed_ms = (time.perf_counter() - t0) * 1000
    log.info("Completed in %.2f ms — %d nodes, %d edges, %d invariants",
             elapsed_ms, len(nodes), len(edges), len(invariants))

    return ProcessObjectResponse(
        request_id=str(uuid.uuid4()),
        status="success",
        object_type=object_type,
        nodes=nodes,
        edges=edges,
        invariants=invariants,
        computation_time_ms=round(elapsed_ms, 3),
        message=f"Successfully computed {len(invariants)} invariants for {object_type}.",
    )
