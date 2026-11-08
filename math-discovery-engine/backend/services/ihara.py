"""
Ihara Zeta Function & Ramanujan Graph Verification Service
==========================================================
Computes the graph-theoretic analogue of the Selberg / Riemann zeta function:
  Z(G, u) = prod_{[C]} (1 - u^{|C|})^{-1}
via Bass's determinant formula (1992):
  Z(G, u)^{-1} = (1 - u^2)^{r - 1} det(I - u A + u^2 (D - I))
where r = |E| - |V| + c is the cyclomatic rank (Betti number beta_1).

Also verifies the Graph Riemann Hypothesis and Ramanujan property:
  lambda_2(A) <= 2 * sqrt(d - 1)
"""

from __future__ import annotations
import logging
from typing import Dict, Any, List, Optional
import networkx as nx
import numpy as np

log = logging.getLogger("math-engine.services.ihara")


def compute_ihara_zeta(G: nx.Graph) -> Dict[str, Any]:
    """
    Compute the Ihara Zeta function polynomial, non-backtracking poles,
    and Ramanujan Graph Riemann Hypothesis certificate.
    """
    n = G.number_of_nodes()
    m = G.number_of_edges()

    if n == 0 or m == 0:
        return {
            "num_vertices": n,
            "num_edges": m,
            "cyclomatic_rank": 0,
            "bass_polynomial_coeffs": [1.0],
            "is_regular": False,
            "degree": 0.0,
            "is_ramanujan": False,
            "ramanujan_bound": 0.0,
            "critical_radius": 1.0,
            "lambda_2": 0.0,
            "girth": None,
            "poles_count": 0,
            "poles": [],
            "latex_formula": r"\mathbf{Z}(G, u)^{-1} = 1",
            "explanation": "Empty or edgeless graph has trivial Ihara Zeta function.",
        }

    c = nx.number_connected_components(G)
    r = m - n + c  # Cyclomatic rank (beta_1)

    # Node indexing
    nodes = list(G.nodes())
    node_to_idx = {node: i for i, node in enumerate(nodes)}

    A = nx.to_numpy_array(G, nodelist=nodes)
    degrees = np.array([G.degree(node) for node in nodes], dtype=float)
    D = np.diag(degrees)
    Q = D - np.eye(n)

    # 1. Reconstruct Bass polynomial P_G(u) = det(I - u*A + u^2*Q) of degree 2n
    degree = 2 * n
    pts = np.exp(1j * np.linspace(0, 2 * np.pi, degree + 1, endpoint=False))
    vals = []
    I_n = np.eye(n)
    for u in pts:
        M = I_n - u * A + (u**2) * Q
        vals.append(np.linalg.det(M))

    V = np.vander(pts, increasing=True)
    try:
        raw_coeffs = np.linalg.solve(V, vals)
        # Real-valued coefficients
        coeffs = [round(float(np.real(val)), 4) for val in raw_coeffs]
    except Exception as e:
        log.warning(f"Error solving Vandermonde for Bass polynomial: {e}")
        coeffs = [1.0]

    # 2. Non-backtracking Hashimoto Matrix B (2m x 2m)
    directed_edges = []
    for u, v in G.edges():
        directed_edges.append((u, v))
        directed_edges.append((v, u))
    m2 = len(directed_edges)

    poles = []
    if m2 > 0 and m2 <= 600:  # Bound to avoid giant matrices on massive graphs
        B = np.zeros((m2, m2), dtype=float)
        for i, (u1, v1) in enumerate(directed_edges):
            for j, (u2, v2) in enumerate(directed_edges):
                if v1 == u2 and v2 != u1:
                    B[i, j] = 1.0

        eigvals = np.linalg.eigvals(B)
        for lam in eigvals:
            if abs(lam) > 1e-5:
                pole = 1.0 / lam
                poles.append({
                    "re": round(float(np.real(pole)), 4),
                    "im": round(float(np.imag(pole)), 4),
                    "abs": round(float(abs(pole)), 4),
                })
        # Sort poles by modulus
        poles.sort(key=lambda p: p["abs"])
    elif m2 > 600:
        # For large graphs, find roots of Bass polynomial directly
        poly_roots = np.roots(coeffs[::-1])
        for p in poly_roots:
            poles.append({
                "re": round(float(np.real(p)), 4),
                "im": round(float(np.imag(p)), 4),
                "abs": round(float(abs(p)), 4),
            })
        poles.sort(key=lambda p: p["abs"])

    # 3. Regularity and Ramanujan verification
    is_regular = bool(np.all(degrees == degrees[0]))
    d = float(degrees[0]) if is_regular else float(np.mean(degrees))

    adj_eigs = np.sort(np.linalg.eigvalsh(A))[::-1]
    ramanujan_bound = float(2.0 * np.sqrt(max(0.0, d - 1.0)))
    critical_radius = float(1.0 / np.sqrt(d - 1.0)) if d > 1.0 else 1.0

    # Second largest non-trivial eigenvalue |lambda_2|
    non_trivial = [lam for lam in adj_eigs if abs(abs(lam) - d) > 1e-4]
    lambda_2 = float(max([abs(lam) for lam in non_trivial])) if non_trivial else 0.0

    is_ramanujan = bool(lambda_2 <= ramanujan_bound + 1e-4) if is_regular and d >= 3 else False

    # 4. Girth (length of shortest cycle)
    try:
        cycles = nx.cycle_basis(G)
        girth = int(min(len(c) for c in cycles)) if cycles else None
    except Exception:
        girth = None

    # 5. LaTeX formula representation
    poly_terms = []
    for p_idx, c_val in enumerate(coeffs):
        if abs(c_val) > 1e-4:
            if p_idx == 0:
                poly_terms.append(f"{c_val:g}")
            elif p_idx == 1:
                poly_terms.append(f"{c_val:+g} u")
            else:
                poly_terms.append(f"{c_val:+g} u^{{{p_idx}}}")
    poly_str = " ".join(poly_terms) if poly_terms else "1"

    if r == 1:
        latex_formula = rf"\mathbf{{Z}}(G, u)^{{-1}} = {poly_str}"
    else:
        latex_formula = rf"\mathbf{{Z}}(G, u)^{{-1}} = (1 - u^2)^{{{r - 1}}} \left( {poly_str} \right)"

    # Explanation narrative
    if is_regular and is_ramanujan:
        explanation = (
            f"The graph is {int(d)}-regular and satisfies the Alon-Boppana Ramanujan bound: "
            f"|λ₂| = {lambda_2:.4f} ≤ 2√(d - 1) = {ramanujan_bound:.4f}. "
            f"By the Ihara-Sunada theorem, all non-trivial poles inside the unit circle lie on the "
            f"critical circle |u| = 1/√(d - 1) = {critical_radius:.4f}, verifying the Graph Riemann Hypothesis!"
        )
    elif is_regular and not is_ramanujan:
        explanation = (
            f"The graph is {int(d)}-regular but fails the Ramanujan condition: "
            f"|λ₂| = {lambda_2:.4f} > 2√(d - 1) = {ramanujan_bound:.4f}. "
            f"Non-trivial poles deviate from the critical circle |u| = {critical_radius:.4f}."
        )
    else:
        explanation = (
            f"Graph has average degree {d:.2f} with cyclomatic rank r = {r}. "
            f"Its Ihara Zeta function encodes {len(poles)} non-backtracking poles in the complex plane, "
            f"bridging the graph spectrum with prime cycle geodesics."
        )

    return {
        "num_vertices": n,
        "num_edges": m,
        "cyclomatic_rank": r,
        "bass_polynomial_coeffs": coeffs,
        "is_regular": is_regular,
        "degree": round(d, 4),
        "is_ramanujan": is_ramanujan,
        "ramanujan_bound": round(ramanujan_bound, 4),
        "critical_radius": round(critical_radius, 4),
        "lambda_2": round(lambda_2, 4),
        "girth": girth,
        "poles_count": len(poles),
        "poles": poles,
        "latex_formula": latex_formula,
        "explanation": explanation,
    }
