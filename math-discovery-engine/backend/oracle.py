import numpy as np
import scipy.linalg as la

def discover_linear_laws(batch_data: list[dict], tolerance: float = 1e-10) -> list[str]:
    if not batch_data:
        return ["No linear relationships found with high confidence."]

    M_rows = []
    for d in batch_data:
        v = float(d.get("vertices", 0))
        e = float(d.get("edges", 0))
        b0 = float(d.get("betti_0", 0))
        alg_conn = float(d.get("algebraic_connectivity", 0.0))
        M_rows.append([v, e, b0, alg_conn, 1.0])
    
    M = np.array(M_rows, dtype=float)
    if M.shape[0] == 0:
        return ["No linear relationships found with high confidence."]
    
    # Run SVD
    U, s, Vh = la.svd(M, full_matrices=False)
    
    conjectures = []
    names = ["V", "E", "β₀", "λ₁", "1"]
    
    for i, singular_value in enumerate(s):
        if singular_value < tolerance:
            v_vec = Vh[i, :]
            
            # Normalize vector by largest absolute non-zero value
            max_val = np.max(np.abs(v_vec))
            if max_val > 1e-12:
                v_vec = v_vec / max_val
                
            # If the largest element was negative, we might want to flip the signs for nicer formatting
            for val in v_vec:
                if abs(val) > 1e-4:
                    if val < 0:
                        v_vec = -v_vec
                    break
            
            terms = []
            for coef, name in zip(v_vec, names):
                if abs(coef) > 1e-4:
                    if name == "1":
                        terms.append(f"{coef:.4f}")
                    else:
                        terms.append(f"{coef:.4f} {name}")
            
            if terms:
                expr = " + ".join(terms)
                expr = expr.replace("+ -", "- ")
                conjectures.append(f"{expr} = 0")

    if not conjectures:
        return ["No linear relationships found with high confidence."]
    return conjectures
