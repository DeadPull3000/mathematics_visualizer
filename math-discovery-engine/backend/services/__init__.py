"""
Mathematical Engine Services
============================
Clean business and mathematical computation services isolated from FastAPI HTTP transports.
"""

from .topology import compute_metadata, compute_full_topology, generate_python_export
from .classifier import classify_graph
from knot_theory import generate_torus_knot
from manifolds import generate_manifold
from complexity import parse_boolean_circuit
from algebraic import generate_algebraic_variety
from batch import generate_batch_data
from tda import process_tda
from wl_test import compute_wl_test
from oracle import discover_linear_laws

__all__ = [
    "compute_metadata",
    "compute_full_topology",
    "classify_graph",
    "generate_python_export",
    "generate_torus_knot",
    "generate_manifold",
    "parse_boolean_circuit",
    "generate_algebraic_variety",
    "generate_batch_data",
    "process_tda",
    "compute_wl_test",
    "discover_linear_laws",
]
