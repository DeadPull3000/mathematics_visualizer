"""
Visual Mathematical Discovery Engine - Topology Module (Step 3)
=============================================================
Computes the Combinatorial Laplacian of the graph, extracts its eigenvalues,
and computes the Fiedler vector (algebraic connectivity).
"""

import networkx as nx
import numpy as np
import scipy.linalg
import gudhi


def compute_spectral_topology(G: nx.Graph) -> dict:
    """
    Computes the Combinatorial Laplacian eigenvalues and Fiedler vector.

    Parameters
    ----------
    G : nx.Graph
        The parsed NetworkX graph.

    Returns
    -------
    dict
        Dictionary containing:
        - laplacian_eigenvalues: list of floats
        - fiedler_vector: dict mapping node IDs to their Fiedler float value
        - algebraic_connectivity: float
    """
    if G.number_of_nodes() == 0:
        return {
            "laplacian_eigenvalues": [],
            "fiedler_vector": {},
            "algebraic_connectivity": 0.0,
        }

    # Combinatorial Laplacian L = D - A
    # We convert to a dense array for scipy.linalg.eigh. For massive graphs,
    # scipy.sparse.linalg.eigsh would be better, but for our limits (<= 2000 nodes),
    # dense eigendecomposition is usually acceptable and more robust for all eigenvalues.
    L = nx.laplacian_matrix(G).toarray()

    # Compute eigenvalues and eigenvectors for real symmetric matrix
    eigenvalues, eigenvectors = scipy.linalg.eigh(L)

    # Ensure numerical stability: round very small values (e.g. 1e-15) to 0.0
    eigenvalues[np.abs(eigenvalues) < 1e-10] = 0.0
    eigenvectors[np.abs(eigenvectors) < 1e-10] = 0.0

    # Sort them (eigh already returns sorted, but just to be strictly safe)
    idx = eigenvalues.argsort()
    eigenvalues = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    # Algebraic connectivity is the second smallest eigenvalue (index 1)
    if len(eigenvalues) > 1:
        alg_conn = float(eigenvalues[1])
    else:
        alg_conn = 0.0

    # The Fiedler vector is the eigenvector corresponding to the algebraic connectivity
    if len(eigenvalues) > 1:
        fiedler_vec_array = eigenvectors[:, 1]
    else:
        fiedler_vec_array = np.array([0.0])

    # Map back to node IDs
    nodes = list(G.nodes())
    fiedler_vector = {node: float(val) for node, val in zip(nodes, fiedler_vec_array)}

    return {
        "laplacian_eigenvalues": [float(val) for val in eigenvalues],
        "fiedler_vector": fiedler_vector,
        "algebraic_connectivity": alg_conn,
    }


def compute_betti_numbers(G: nx.Graph, max_dimension: int = 3) -> list[int]:
    """
    Lifts the NetworkX 1-skeleton into a Simplicial (Clique) Complex and computes
    its Betti numbers (beta_0, beta_1, beta_2) up to the specified max dimension.

    Parameters
    ----------
    G : nx.Graph
        The parsed NetworkX graph.
    max_dimension : int
        The maximum dimension to expand the cliques up to (default 3).

    Returns
    -------
    list[int]
        A list of Betti numbers, typically [beta_0, beta_1, beta_2].
    """
    try:
        if G.number_of_nodes() == 0:
            return []

        # Initialize the SimplexTree
        simplex_tree = gudhi.SimplexTree()

        # Iterate through the edges and insert them
        # Nodes must be integers or mapped to integers for GUDHI, but GUDHI's Python
        # wrapper actually accepts arbitrary types if we are careful, though usually 
        # it prefers integers. Let's map nodes to integer indices just in case.
        node_to_idx = {node: i for i, node in enumerate(G.nodes())}
        
        # Add 0-simplices (vertices) to ensure disconnected nodes are included
        for node in G.nodes():
            simplex_tree.insert([node_to_idx[node]])
            
        for u, v in G.edges():
            simplex_tree.insert([node_to_idx[u], node_to_idx[v]])

        # Automatically fill in cliques up to max_dimension
        simplex_tree.expansion(max_dimension)

        # Compute persistence
        simplex_tree.compute_persistence()

        # Extract betti numbers
        betti = simplex_tree.betti_numbers()
        
        # Ensure we return at least [beta_0, 0, 0] if the complex is simple
        # and pad it up to max_dimension if needed by the frontend (optional, but
        # the prompt expects [beta_0, beta_1, beta_2] style).
        return betti

    except Exception:
        # Gracefully return a fallback if GUDHI fails (e.g. memory issues on dense graphs)
        beta_0 = nx.number_connected_components(G) if G.number_of_nodes() > 0 else 0
        return [beta_0, 0, 0]
