"""
Visual Mathematical Discovery Engine - Topology Module (Phase 1 Deep Math)
==========================================================================
Computes Combinatorial & Normalized Laplacians, Cheeger Conductance Bounds,
Multi-Scale Heat Kernel Signatures (HKS), and Simplicial Homology with
explicit H1 non-bounding cycle generators.
"""

from __future__ import annotations

import networkx as nx
import numpy as np
import scipy.linalg as la


def compute_spectral_topology(G: nx.Graph) -> dict:
    """
    Computes spectral graph theory invariants:
    - Combinatorial Laplacian eigenvalues & Fiedler vector
    - Normalized Laplacian eigenvalues & spectral gap
    - Cheeger inequality bounds on graph conductance: h_lower <= h(G) <= h_upper
    - Multi-scale Heat Kernel Signatures (diffusion timescales t = 0.1, 1.0, 10.0)
    """
    n = G.number_of_nodes()
    if n == 0:
        return {
            "laplacian_eigenvalues": [],
            "fiedler_vector": {},
            "algebraic_connectivity": 0.0,
            "normalized_eigenvalues": [],
            "spectral_gap": 0.0,
            "cheeger_bounds": {"lower": 0.0, "upper": 0.0},
            "heat_kernel_signatures": {"0.1": {}, "1.0": {}, "10.0": {}},
        }

    nodes = list(G.nodes())

    # 1. Combinatorial Laplacian L = D - A
    L = nx.laplacian_matrix(G).toarray()
    eigenvalues, eigenvectors = la.eigh(L)

    # Numerical cleanup
    eigenvalues[np.abs(eigenvalues) < 1e-10] = 0.0
    eigenvectors[np.abs(eigenvectors) < 1e-10] = 0.0

    idx = eigenvalues.argsort()
    eigenvalues = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    alg_conn = float(eigenvalues[1]) if len(eigenvalues) > 1 else 0.0
    fiedler_vec_array = eigenvectors[:, 1] if len(eigenvalues) > 1 else np.zeros(n)
    fiedler_vector = {node: round(float(val), 6) for node, val in zip(nodes, fiedler_vec_array)}

    # 2. Normalized Laplacian L_norm = D^{-1/2} L D^{-1/2}
    degrees = np.array([float(d) for _, d in G.degree()])
    inv_sqrt_deg = np.zeros(n)
    non_zero_deg = degrees > 0
    inv_sqrt_deg[non_zero_deg] = 1.0 / np.sqrt(degrees[non_zero_deg])
    D_inv_sqrt = np.diag(inv_sqrt_deg)

    L_norm = D_inv_sqrt @ L @ D_inv_sqrt
    norm_eigenvalues, norm_eigenvectors = la.eigh(L_norm)
    norm_eigenvalues[np.abs(norm_eigenvalues) < 1e-10] = 0.0
    norm_eigenvalues = np.sort(norm_eigenvalues)

    spectral_gap = float(norm_eigenvalues[1]) if len(norm_eigenvalues) > 1 else 0.0

    # 3. Cheeger Conductance Bounds
    # Cheeger Inequality: nu_1 / 2 <= h(G) <= sqrt(2 * nu_1)
    if nx.is_connected(G) and n > 1 and spectral_gap > 0:
        cheeger_lower = round(spectral_gap / 2.0, 5)
        cheeger_upper = round(float(np.sqrt(min(4.0, max(0.0, 2.0 * spectral_gap)))), 5)
    else:
        cheeger_lower = 0.0
        cheeger_upper = 0.0

    # 4. Multi-Scale Heat Kernel Signatures: HKS_t(u) = sum_i exp(-t * lambda_i) * (phi_i(u))^2
    timescales = [0.1, 1.0, 10.0]
    hks_dict = {}
    for t in timescales:
        # Vectorized over all nodes u
        exp_factors = np.exp(-t * eigenvalues)
        hks_vals = np.sum(exp_factors * (eigenvectors ** 2), axis=1)
        max_v = np.max(hks_vals) if np.max(hks_vals) > 0 else 1.0
        min_v = np.min(hks_vals)
        denom = (max_v - min_v) if (max_v - min_v) > 1e-9 else 1.0
        hks_norm = (hks_vals - min_v) / denom
        hks_dict[str(t)] = {node: round(float(val), 5) for node, val in zip(nodes, hks_norm)}

    return {
        "laplacian_eigenvalues": [round(float(val), 5) for val in eigenvalues],
        "fiedler_vector": fiedler_vector,
        "algebraic_connectivity": round(alg_conn, 5),
        "normalized_eigenvalues": [round(float(val), 5) for val in norm_eigenvalues],
        "spectral_gap": round(spectral_gap, 5),
        "cheeger_bounds": {"lower": cheeger_lower, "upper": cheeger_upper},
        "heat_kernel_signatures": hks_dict,
    }


def compute_simplicial_homology(G: nx.Graph) -> dict:
    """
    Computes Betti numbers (b0, b1, b2), extracts 2-simplices (triangles),
    and finds explicit non-bounding 1-cycle generators for H1 via orthogonal projection.
    """
    if G.number_of_nodes() == 0:
        return {
            "betti_numbers": [0, 0, 0],
            "triangles": [],
            "h1_generators": [],
        }

    try:
        # 1. Enumerate cliques (simplices) up to dimension 3
        cliques = list(nx.enumerate_all_cliques(G))
        C = {0: [], 1: [], 2: [], 3: []}
        for c in cliques:
            k = len(c) - 1
            if k <= 3:
                C[k].append(tuple(sorted(c)))

        n = [len(C[0]), len(C[1]), len(C[2]), len(C[3])]

        # 2. Build Boundary Matrices
        def build_boundary_matrix(k):
            if n[k] == 0 or n[k - 1] == 0:
                return np.zeros((n[k - 1], n[k]))
            idx_k_minus_1 = {simplex: i for i, simplex in enumerate(C[k - 1])}
            M = np.zeros((n[k - 1], n[k]))
            for col_idx, simplex in enumerate(C[k]):
                for i in range(k + 1):
                    face = simplex[:i] + simplex[i + 1:]
                    if face in idx_k_minus_1:
                        row_idx = idx_k_minus_1[face]
                        M[row_idx, col_idx] = (-1) ** i
            return M

        D1 = build_boundary_matrix(1)
        D2 = build_boundary_matrix(2)
        D3 = build_boundary_matrix(3)

        # 3. Compute matrix ranks
        r1 = int(np.linalg.matrix_rank(D1)) if D1.size > 0 else 0
        r2 = int(np.linalg.matrix_rank(D2)) if D2.size > 0 else 0
        r3 = int(np.linalg.matrix_rank(D3)) if D3.size > 0 else 0

        # 4. Rank-Nullity Theorem for Betti numbers
        b0 = max(0, n[0] - r1)
        b1 = max(0, n[1] - r1 - r2)
        b2 = max(0, n[2] - r2 - r3)

        # 5. Extract triangles (2-simplices)
        triangles = [[s[0], s[1], s[2]] for s in C[2]]

        # 6. Extract explicit H1 non-bounding cycle generators
        h1_generators = []
        if b1 > 0 and n[1] > 0:
            edge_idx = {e: i for i, e in enumerate(C[1])}
            graph_cycles = nx.cycle_basis(G)
            basis_vectors = []

            for cycle in graph_cycles:
                w = np.zeros(n[1])
                for k in range(len(cycle)):
                    u = cycle[k]
                    v = cycle[(k + 1) % len(cycle)]
                    sorted_edge = tuple(sorted((u, v)))
                    if sorted_edge in edge_idx:
                        w[edge_idx[sorted_edge]] = 1.0 if u < v else -1.0

                # Project onto orthogonal complement of im(D2)
                if D2.shape[1] > 0 and r2 > 0:
                    sol, _, _, _ = la.lstsq(D2, w)
                    w_orth = w - D2 @ sol
                else:
                    w_orth = w

                norm_orth = la.norm(w_orth)
                if norm_orth > 1e-4:
                    cand = w_orth / norm_orth
                    if len(basis_vectors) == 0:
                        basis_vectors.append(cand)
                        h1_generators.append(cycle)
                    else:
                        # Gram-Schmidt independence check
                        B = np.array(basis_vectors).T
                        proj = B @ (B.T @ cand)
                        if la.norm(cand - proj) > 1e-3:
                            basis_vectors.append(cand)
                            h1_generators.append(cycle)

                if len(h1_generators) >= b1:
                    break

        return {
            "betti_numbers": [int(b0), int(b1), int(b2)],
            "triangles": triangles,
            "h1_generators": h1_generators,
        }

    except Exception as e:
        return {
            "betti_numbers": [nx.number_connected_components(G), 0, 0],
            "triangles": [],
            "h1_generators": [],
        }


def compute_betti_numbers(G: nx.Graph) -> list[int]:
    """Backward compatibility wrapper returning [b0, b1, b2]."""
    return compute_simplicial_homology(G)["betti_numbers"]
