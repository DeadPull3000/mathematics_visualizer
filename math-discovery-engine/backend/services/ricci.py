"""
Discrete Ollivier-Ricci Curvature & Bottleneck Analysis Service
===============================================================
Computes discrete Ollivier-Ricci curvature on graph edges:
  kappa(u, v) = 1 - W_1(m_u, m_v) / d(u, v)
where W_1 is the 1-Wasserstein (Earth Mover's) distance between
uniform neighborhood distributions m_u and m_v, solved via optimal transport LP.

Positive curvature (kappa > 0.1): Clique / cluster cores.
Flat curvature (-0.1 <= kappa <= 0.1): Grids and trees.
Negative curvature (kappa < -0.1): Hyperbolic bridges and network bottlenecks.
"""

from __future__ import annotations
import logging
from typing import Dict, Any, List, Union
import networkx as nx
import numpy as np
from scipy.optimize import linprog

log = logging.getLogger("math-engine.services.ricci")


def compute_ollivier_ricci(G: nx.Graph, alpha: float = 0.0) -> Dict[str, Any]:
    """
    Compute Ollivier-Ricci curvature on all edges in G using optimal transport.
    """
    n = G.number_of_nodes()
    m = G.number_of_edges()

    if m == 0:
        return {
            "edges": [],
            "average_curvature": 0.0,
            "min_curvature": 0.0,
            "max_curvature": 0.0,
            "bottlenecks": [],
            "clusters": [],
            "diameter": 0,
            "explanation": "Edgeless graph has no edges to evaluate Ricci curvature.",
        }

    # Shortest path distances
    spl = dict(nx.all_pairs_shortest_path_length(G))

    # Graph diameter
    try:
        if nx.is_connected(G):
            diameter = int(nx.diameter(G))
        else:
            components = [G.subgraph(c).copy() for c in nx.connected_components(G)]
            diameter = max([nx.diameter(comp) for comp in components if comp.number_of_nodes() > 1] or [0])
    except Exception:
        diameter = 0

    edge_results = []
    curvatures = []
    bottlenecks = []
    clusters = []

    for u, v in G.edges():
        nu = list(G.neighbors(u))
        nv = list(G.neighbors(v))
        deg_u = len(nu)
        deg_v = len(nv)

        if deg_u == 0 or deg_v == 0:
            k_val = 0.0
            edge_type = "flat"
        else:
            # Setup probability measures
            if alpha > 0.0:
                supp_u = [u] + nu
                mu = [alpha] + [(1.0 - alpha) / deg_u] * deg_u
                supp_v = [v] + nv
                mv = [alpha] + [(1.0 - alpha) / deg_v] * deg_v
            else:
                supp_u = nu
                mu = [1.0 / deg_u] * deg_u
                supp_v = nv
                mv = [1.0 / deg_v] * deg_v

            n_u = len(supp_u)
            n_v = len(supp_v)

            # Cost vector (distances)
            c = np.zeros(n_u * n_v, dtype=float)
            for i, x in enumerate(supp_u):
                for j, y in enumerate(supp_v):
                    c[i * n_v + j] = spl.get(x, {}).get(y, 999.0)

            # Equality constraints for marginals
            A_eq = np.zeros((n_u + n_v, n_u * n_v), dtype=float)
            for i in range(n_u):
                for j in range(n_v):
                    A_eq[i, i * n_v + j] = 1.0
            for j in range(n_v):
                for i in range(n_u):
                    A_eq[n_u + j, i * n_v + j] = 1.0

            b_eq = np.concatenate([mu, mv])

            try:
                res = linprog(c, A_eq=A_eq, b_eq=b_eq, bounds=(0, None), method="highs")
                w1 = float(res.fun) if res.success else 1.0
            except Exception as e:
                log.warning(f"linprog failure for edge ({u}, {v}): {e}")
                w1 = 1.0

            k_val = round(float(1.0 - w1), 4)

            if k_val < -0.1:
                edge_type = "bottleneck"
                bottlenecks.append([u, v])
            elif k_val > 0.1:
                edge_type = "cluster"
                clusters.append([u, v])
            else:
                edge_type = "flat"

        curvatures.append(k_val)
        edge_results.append({
            "u": u,
            "v": v,
            "curvature": k_val,
            "type": edge_type,
        })

    avg_curv = round(float(np.mean(curvatures)), 4) if curvatures else 0.0
    min_curv = round(float(np.min(curvatures)), 4) if curvatures else 0.0
    max_curv = round(float(np.max(curvatures)), 4) if curvatures else 0.0

    # Human-readable explanation
    if len(bottlenecks) > 0:
        explanation = (
            f"Network exhibits mixed Riemannian/hyperbolic geometry with scalar curvature R = {avg_curv:.4f}. "
            f"Detected {len(bottlenecks)} topological bottleneck edge(s) with negative curvature "
            f"(min κ = {min_curv:.4f}) bridging dense communities (max κ = {max_curv:.4f})."
        )
    elif min_curv >= 0.0:
        explanation = (
            f"Graph possesses non-negative Ricci curvature everywhere (mean κ = {avg_curv:.4f}, min κ = {min_curv:.4f}). "
            f"Information spreads rapidly without communication choke points, characteristic of dense clique complexes and expanders."
        )
    else:
        explanation = (
            f"Scalar Ricci curvature R = {avg_curv:.4f} across {m} edges with diameter {diameter}. "
            f"Curvature range: [{min_curv:.4f}, {max_curv:.4f}]."
        )

    return {
        "edges": edge_results,
        "average_curvature": avg_curv,
        "min_curvature": min_curv,
        "max_curvature": max_curv,
        "bottlenecks": bottlenecks,
        "clusters": clusters,
        "diameter": diameter,
        "explanation": explanation,
    }
