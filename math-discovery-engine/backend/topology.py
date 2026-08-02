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
    try:
        st = gudhi.SimplexTree()
        
        # FIX: GUDHI strictly requires standard Python integers. 
        # We map whatever the node IDs are (strings, numpy ints) to pure ints.
        node_to_int = {node: i for i, node in enumerate(G.nodes())}
        
        for u, v in G.edges():
            st.insert([node_to_int[u], node_to_int[v]])
            
        # Expand the complex to fill in triangles and tetrahedra
        st.expansion(max_dimension)
        
        # Compute persistence to find the topological holes
        st.compute_persistence()
        betti = st.betti_numbers()
        
        # FIX: For C_6, betti is [1, 1]. We need to pad it to [1, 1, 0] 
        # so the frontend doesn't read undefined for Beta_2!
        while len(betti) < 3:
            betti.append(0)
            
        return betti[:3]
        
    except Exception as e:
        # Let's print the error to the terminal so it doesn't fail silently anymore!
        print(f"GUDHI CRASHED: {e}")
        return [nx.number_connected_components(G), 0, 0]
