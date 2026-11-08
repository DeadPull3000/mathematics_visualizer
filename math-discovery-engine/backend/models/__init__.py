"""
Domain-specific Pydantic schemas for the Visual Mathematical Discovery Engine.
=============================================================================
All schemas are re-exported here for complete backward compatibility.
"""

from .base import InputType
from .topology import (
    MathRequest,
    GraphMetadata,
    TopologyMetadata,
    MathResponse,
)
from .knots import KnotRequest, KnotResponse
from .manifolds import ManifoldRequest, ManifoldResponse
from .circuits import CircuitRequest, CircuitResponse
from .algebraic import AlgebraicRequest, AlgebraicResponse
from .batch import BatchRequest, BatchResponse
from .tda import TDARequest, TDAResponse
from .wl import WLRequest, WLResponse
from .oracle import OracleRequest, OracleResponse
from .narrator import NarratorRequest, NarratorResponse
from .gnn import GNNInspectRequest, GNNInspectResponse
from .frontiers import (
    IharaPole,
    IharaRequest,
    IharaResponse,
    RicciEdge,
    RicciRequest,
    RicciResponse,
    TropicalRequest,
    TropicalResponse,
)

__all__ = [
    "InputType",
    "MathRequest",
    "GraphMetadata",
    "TopologyMetadata",
    "MathResponse",
    "KnotRequest",
    "KnotResponse",
    "ManifoldRequest",
    "ManifoldResponse",
    "CircuitRequest",
    "CircuitResponse",
    "AlgebraicRequest",
    "AlgebraicResponse",
    "BatchRequest",
    "BatchResponse",
    "TDARequest",
    "TDAResponse",
    "WLRequest",
    "WLResponse",
    "OracleRequest",
    "OracleResponse",
    "NarratorRequest",
    "NarratorResponse",
    "GNNInspectRequest",
    "GNNInspectResponse",
    "IharaPole",
    "IharaRequest",
    "IharaResponse",
    "RicciEdge",
    "RicciRequest",
    "RicciResponse",
    "TropicalRequest",
    "TropicalResponse",
]
