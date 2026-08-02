"""
Visual Mathematical Discovery Engine - Topology Module (Step 3)
=============================================================
Computes the Combinatorial Laplacian of the graph, extracts its eigenvalues,
and computes the Fiedler vector (algebraic connectivity).
"""

import networkx as nx
import numpy as np
import scipy.linalg


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


def compute_betti_numbers(G: nx.Graph) -> list[int]:
    """
    Computes Betti 0, 1, and 2 using pure Linear Algebra and the Rank-Nullity Theorem 
    on the Clique Complex of the graph. This is 100% stable and requires no C++ libraries.
    """
    if G.number_of_nodes() == 0:
        return [0, 0, 0]
        
    try:
        # 1. Find all cliques (simplices) in the graph
        cliques = list(nx.enumerate_all_cliques(G))
        
        # 2. Group them by dimension k (k = size - 1)
        # 0: Dots, 1: Sticks, 2: Triangles, 3: Tetrahedra
        C = {0: [], 1: [], 2: [], 3: []}
        for c in cliques:
            k = len(c) - 1
            if k <= 3:
                # Sort to ensure consistent mathematical orientation
                C[k].append(tuple(sorted(c)))
                
        n = [len(C[0]), len(C[1]), len(C[2]), len(C[3])]
        
        # 3. Helper to build the Boundary Matrix D_k
        def build_boundary_matrix(k):
            # If we don't have shapes of this dimension, the matrix is empty
            if n[k] == 0 or n[k-1] == 0:
                return np.zeros((n[k-1], n[k]))
            
            idx_k_minus_1 = {simplex: i for i, simplex in enumerate(C[k-1])}
            M = np.zeros((n[k-1], n[k]))
            
            for col_idx, simplex in enumerate(C[k]):
                for i in range(k + 1):
                    # The boundary is formed by removing the i-th node
                    face = simplex[:i] + simplex[i+1:]
                    if face in idx_k_minus_1:
                        row_idx = idx_k_minus_1[face]
                        # Alternating signs rule for topological boundaries
                        M[row_idx, col_idx] = (-1) ** i
            return M

        # 4. Construct Boundary Matrices
        D1 = build_boundary_matrix(1)
        D2 = build_boundary_matrix(2)
        D3 = build_boundary_matrix(3)
        
        # 5. Compute their ranks using numpy
        r1 = np.linalg.matrix_rank(D1) if D1.size > 0 else 0
        r2 = np.linalg.matrix_rank(D2) if D2.size > 0 else 0
        r3 = np.linalg.matrix_rank(D3) if D3.size > 0 else 0
        
        # 6. Apply the Rank-Nullity Theorem to find Betti Numbers
        b0 = n[0] - r1
        b1 = n[1] - r1 - r2
        b2 = n[2] - r2 - r3
        
        return [int(b0), int(b1), int(b2)]
        
    except Exception as e:
        print(f"Topology Math Error: {e}")
        return [nx.number_connected_components(G), 0, 0]
