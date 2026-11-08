"""
Graph Family Classifier & Structural Predicates (Phase 3)
=========================================================
Evaluates graph-theoretic properties and classifies graphs into standard
mathematical families (Trees, Bipartite, Eulerian, Regular, Chordal, etc.).
"""

from __future__ import annotations
import networkx as nx


def classify_graph(G: nx.Graph) -> dict:
    """
    Classifies a NetworkX graph into canonical mathematical families
    and extracts metric properties.
    """
    n = G.number_of_nodes()
    m = G.number_of_edges()

    if n == 0:
        return {
            "family_name": "Null Graph",
            "is_tree": False,
            "is_forest": False,
            "is_bipartite": False,
            "is_eulerian": False,
            "is_regular": False,
            "regular_degree": None,
            "is_chordal": False,
            "girth": None,
            "diameter": None,
            "radius": None,
            "clustering_coefficient": 0.0,
            "transitivity": 0.0,
        }

    is_connected = nx.is_connected(G) if n > 0 else False
    is_tree = nx.is_tree(G) if n > 0 else False
    is_forest = nx.is_forest(G) if n > 0 else False
    is_bipartite = nx.is_bipartite(G) if n > 0 else False
    is_eulerian = nx.is_eulerian(G) if n > 0 and is_connected else False

    # Regularity check
    degrees = [d for _, d in G.degree()]
    is_regular = len(set(degrees)) == 1 if n > 0 else False
    regular_degree = degrees[0] if is_regular else None

    # Chordal check (skipped for very large graphs)
    is_chordal = nx.is_chordal(G) if m <= 1500 else None

    # Metric properties (diameter and radius for connected graphs)
    diameter = None
    radius = None
    if is_connected and n <= 1000:
        try:
            diameter = int(nx.diameter(G))
            radius = int(nx.radius(G))
        except Exception:
            pass

    # Girth (length of shortest cycle)
    girth = None
    if n <= 1000:
        try:
            cycles = nx.cycle_basis(G)
            if cycles:
                girth = min(len(c) for c in cycles)
        except Exception:
            pass

    # Transitivity and average clustering
    try:
        clustering_coeff = round(float(nx.average_clustering(G)), 4)
        transitivity_val = round(float(nx.transitivity(G)), 4)
    except Exception:
        clustering_coeff = 0.0
        transitivity_val = 0.0

    # Family identification label
    if is_tree:
        family = "Tree"
    elif is_forest:
        family = "Forest (Acyclic)"
    elif is_regular and regular_degree == 2 and is_connected:
        family = f"Cycle Graph C_{n}"
    elif is_regular and regular_degree == n - 1:
        family = f"Complete Graph K_{n}"
    elif is_bipartite:
        family = "Bipartite Graph"
    elif is_eulerian:
        family = "Eulerian Graph"
    else:
        family = "General Graph"

    return {
        "family_name": family,
        "is_tree": is_tree,
        "is_forest": is_forest,
        "is_bipartite": is_bipartite,
        "is_eulerian": is_eulerian,
        "is_regular": is_regular,
        "regular_degree": regular_degree,
        "is_chordal": is_chordal,
        "girth": girth,
        "diameter": diameter,
        "radius": radius,
        "clustering_coefficient": clustering_coeff,
        "transitivity": transitivity_val,
    }
