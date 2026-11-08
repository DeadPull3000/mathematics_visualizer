"""
Conjecture Oracle & Automated Law Discovery (Phase 3)
=====================================================
Discovers linear and non-linear polynomial laws connecting topological invariants
using SVD Null-Space analysis and flags structural anomalies via Isolation Forests.
"""

from __future__ import annotations
import math
from typing import Any, Dict, List
import numpy as np
import scipy.linalg as la
from sklearn.ensemble import IsolationForest


def _format_null_vector(v_vec: np.ndarray, names: list[str]) -> str | None:
    """Formats a single null-space vector into a clean mathematical equation string."""
    max_val = np.max(np.abs(v_vec))
    if max_val < 1e-12:
        return None

    # Normalize by largest coefficient
    v_norm = v_vec / max_val

    # Ensure first significant non-zero coefficient is positive
    for val in v_norm:
        if abs(val) > 1e-3:
            if val < 0:
                v_norm = -v_norm
            break

    terms = []
    for coef, name in zip(v_norm, names):
        if abs(coef) > 5e-3:
            # Round near-integers
            nearest_int = round(float(coef))
            if abs(coef - nearest_int) < 0.02:
                if nearest_int == 0:
                    continue
                r_coef = f"{nearest_int}.0" if nearest_int != 1 or name == "1" else ""
                if nearest_int == -1 and name != "1":
                    r_coef = "-"
            else:
                rounded_val = round(float(coef), 4)
                if abs(rounded_val) < 1e-4:
                    continue
                r_coef = f"{rounded_val}"

            if name == "1":
                terms.append(f"{r_coef}")
            elif r_coef == "" or r_coef == "1.0":
                terms.append(f"{name}")
            elif r_coef == "-" or r_coef == "-1.0":
                terms.append(f"-{name}")
            else:
                terms.append(f"{r_coef} {name}")

    if not terms:
        return None

    # Construct equation
    expr = " + ".join(terms)
    expr = expr.replace("+ -", "- ")
    expr = expr.replace("+ -1.0 ", "- ")
    expr = expr.replace("- -", "+ ")
    return f"{expr} = 0"


def discover_linear_laws(batch_data: list[dict], tolerance: float = 1e-6) -> list[str]:
    """
    Discovers linear relationships between invariants:
    Columns: [V, E, β₀, λ₁, 1]
    """
    if not batch_data or len(batch_data) < 2:
        return []

    m_rows = []
    for d in batch_data:
        v = float(d.get("vertices", 0))
        e = float(d.get("edges", 0))
        b0 = float(d.get("betti_0", 0))
        alg_conn = float(d.get("algebraic_connectivity", 0.0))
        m_rows.append([v, e, b0, alg_conn, 1.0])

    M = np.array(m_rows, dtype=float)
    if M.shape[0] < M.shape[1]:
        return ["Insufficient batch samples for null-space convergence."]

    U, s, Vh = la.svd(M, full_matrices=False)
    names = ["V", "E", "β₀", "λ₁", "1"]
    conjectures = []

    # Dynamic tolerance based on top singular value
    threshold = max(tolerance, s[0] * 1e-7)

    for i in range(len(s)):
        if s[i] < threshold:
            eq = _format_null_vector(Vh[i, :], names)
            if eq and eq not in conjectures:
                conjectures.append(eq)

    if not conjectures:
        return ["No exact linear invariant laws satisfied across all batch samples."]

    return conjectures


def discover_polynomial_laws(batch_data: list[dict], tolerance: float = 1e-5) -> list[str]:
    """
    Discovers non-linear quadratic/cross-term polynomial relationships:
    Columns: [V, E, β₀, V², E², V·E, ρ·binom(V,2), 1]
    """
    if not batch_data or len(batch_data) < 4:
        return []

    m_rows = []
    for d in batch_data:
        v = float(d.get("vertices", 0))
        e = float(d.get("edges", 0))
        b0 = float(d.get("betti_0", 0))
        rho = float(d.get("density", 0.0))
        binom_v2 = (v * (v - 1.0)) / 2.0 if v >= 2 else 0.0
        rho_binom = rho * binom_v2

        m_rows.append([
            v,
            e,
            b0,
            v * v,
            e * e,
            v * e,
            rho_binom,
            1.0,
        ])

    M = np.array(m_rows, dtype=float)
    if M.shape[0] < M.shape[1]:
        return ["Insufficient samples for polynomial manifold resolution."]

    # SVD null space
    U, s, Vh = la.svd(M, full_matrices=False)
    names = ["V", "E", "β₀", "V²", "E²", "V·E", "ρ·binom(V,2)", "1"]
    conjectures = []

    threshold = max(tolerance, s[0] * 1e-6)

    for i in range(len(s)):
        if s[i] < threshold:
            eq = _format_null_vector(Vh[i, :], names)
            if eq and eq not in conjectures:
                conjectures.append(eq)

    if not conjectures:
        return ["No non-linear polynomial laws found with zero empirical residual."]

    return conjectures


def detect_anomalies(batch_data: list[dict], top_k: int = 4) -> list[dict]:
    """
    Identifies statistical topological outliers in the batch using an Isolation Forest.
    """
    if not batch_data or len(batch_data) < 6:
        return []

    features = []
    for d in batch_data:
        v = float(d.get("vertices", 0))
        e = float(d.get("edges", 0))
        rho = float(d.get("density", 0.0))
        b0 = float(d.get("betti_0", 1))
        alg_conn = float(d.get("algebraic_connectivity", 0.0))
        features.append([v, e, rho, b0, alg_conn])

    X = np.array(features, dtype=float)
    iso = IsolationForest(contamination=0.08, random_state=42)
    iso.fit(X)
    scores = iso.decision_function(X)  # lower = more abnormal

    # Rank indices by anomaly severity
    anomaly_indices = np.argsort(scores)[:top_k]
    anomalies = []

    for idx in anomaly_indices:
        item = batch_data[idx]
        v = item.get("vertices", 0)
        e = item.get("edges", 0)
        rho = item.get("density", 0.0)
        b0 = item.get("betti_0", 1)
        ac = item.get("algebraic_connectivity", 0.0)

        # Diagnose anomaly cause
        reasons = []
        if b0 > 2:
            reasons.append(f"Highly disconnected ({b0} components)")
        elif b0 == 1 and ac == 0.0:
            reasons.append("Articulation bottleneck (connected but λ₁=0)")
        if rho > 0.85:
            reasons.append(f"Extreme dense clique cluster (ρ={rho:.2f})")
        elif rho < 0.08 and v > 15:
            reasons.append(f"Sparse degenerate tree structure (ρ={rho:.2f})")
        if not reasons:
            reasons.append("Multi-invariant metric divergence from batch manifold")

        anomalies.append({
            "id": int(item.get("id", idx)),
            "vertices": v,
            "edges": e,
            "density": rho,
            "betti_0": b0,
            "algebraic_connectivity": ac,
            "anomaly_score": round(float(scores[idx]), 4),
            "reason": "; ".join(reasons),
        })

    return anomalies


def discover_all_laws(batch_data: list[dict]) -> dict:
    """
    Full automated discovery pipeline: linear laws, polynomial cross-term laws,
    and statistical anomaly detection.
    """
    linear = discover_linear_laws(batch_data)
    polynomial = discover_polynomial_laws(batch_data)
    anomalies = detect_anomalies(batch_data)

    # Combined master list of conjectures
    all_conjectures = []
    for c in linear:
        if "No exact" not in c and "Insufficient" not in c:
            all_conjectures.append(f"[Linear] {c}")
    for c in polynomial:
        if "No non-linear" not in c and "Insufficient" not in c:
            all_conjectures.append(f"[Polynomial] {c}")

    if not all_conjectures:
        all_conjectures = ["No unified linear or polynomial laws spanned the entire batch."]

    return {
        "conjectures": all_conjectures,
        "linear_conjectures": linear,
        "polynomial_conjectures": polynomial,
        "anomalies": anomalies,
    }
