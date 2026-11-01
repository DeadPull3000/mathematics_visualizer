import numpy as np
import scipy.linalg as la

def discover_linear_laws(batch_data: list[dict], tolerance: float = 1e-10) -> list[str]:
    """
    Discovers linear algebraic relationships between graph invariants
    using Singular Value Decomposition (SVD) to compute the null space.
    """
    if not batch_data:
        return []

    m_rows = []
    for d in batch_data:
        v = float(d.get("vertices", 0))
        e = float(d.get("edges", 0))
        b0 = float(d.get("betti_0", 0))
        alg_conn = float(d.get("algebraic_connectivity", 0.0))
        m_rows.append([v, e, b0, alg_conn, 1.0])

    M = np.array(m_rows, dtype=float)
    if M.shape[0] == 0:
        return []

    # Run SVD
    U, s, Vh = la.svd(M)

    conjectures = []
    names = ["V", "E", "β₀", "λ₁", "1"]

    for i in range(len(s)):
        if s[i] < tolerance:
            v_vec = Vh[i, :]

            # Normalize vector by dividing by its largest absolute non-zero value
            max_val = np.max(np.abs(v_vec))
            if max_val > 1e-12:
                v_vec = v_vec / max_val

            # Make the first significant coefficient positive for standard equation form
            for val in v_vec:
                if abs(val) > 1e-4:
                    if val < 0:
                        v_vec = -v_vec
                    break

            terms = []
            for coef, name in zip(v_vec, names):
                if abs(coef) > 1e-4:
                    r_coef = round(float(coef), 4)
                    if name == "1":
                        terms.append(f"{r_coef}")
                    else:
                        terms.append(f"{r_coef} {name}")

            if terms:
                expr = " + ".join(terms)
                expr = expr.replace("+ -", "- ")
                conjectures.append(f"{expr} = 0")

    if not conjectures:
        return ["No linear relationships found with high confidence."]

    return conjectures
