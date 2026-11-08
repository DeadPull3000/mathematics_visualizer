"""
Batch Dataset Generation & Progressive Streaming (Phase 4)
==========================================================
Generates synthetic random graph ensembles and supports real-time
incremental streaming for the Batch Explorer visualizer.
"""

from __future__ import annotations
import random
from typing import Dict, List
import networkx as nx
import numpy as np


def generate_single_sample(sample_id: int) -> Dict[str, float | int]:
    """Generates a single random Erdos-Renyi graph and extracts fundamental invariants."""
    N = random.randint(5, 30)
    p = random.uniform(0.05, 0.95)
    G = nx.erdos_renyi_graph(N, p)

    vertices = G.number_of_nodes()
    edges = G.number_of_edges()
    density = nx.density(G)
    betti_0 = nx.number_connected_components(G)

    L = nx.laplacian_matrix(G).toarray()
    eigenvalues = np.sort(np.linalg.eigvalsh(L))
    alg_conn = float(eigenvalues[1]) if len(eigenvalues) > 1 else 0.0

    return {
        "id": sample_id,
        "vertices": vertices,
        "edges": edges,
        "density": round(float(density), 4),
        "algebraic_connectivity": round(alg_conn, 4),
        "betti_0": betti_0,
    }


def generate_batch_data(num_samples: int = 100) -> List[Dict[str, float | int]]:
    """Generates an ensemble of random graphs synchronously."""
    return [generate_single_sample(i) for i in range(num_samples)]
