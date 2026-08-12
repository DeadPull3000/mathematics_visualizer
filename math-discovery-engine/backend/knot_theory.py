import numpy as np

def compute_gauss_linking_integral(nodes: list[dict]) -> tuple[float, dict]:
    """
    Computes the discrete Gauss linking integral for a 3D space curve to find the Writhe
    and local entanglement saliency.
    """
    N = len(nodes)
    if N < 2:
        return 0.0, {n["id"]: 0.0 for n in nodes}
    
    R = np.array([[n["fx"], n["fy"], n["fz"]] for n in nodes], dtype=float)
    
    # Central difference for periodic curve
    R_next = np.roll(R, -1, axis=0)
    R_prev = np.roll(R, 1, axis=0)
    dR = (R_next - R_prev) / 2.0
    
    R_diff = R[:, None, :] - R[None, :, :]
    
    dist_sq = np.sum(R_diff**2, axis=-1)
    dist = np.sqrt(dist_sq)
    dist_cubed = dist**3
    
    # Avoid division by zero on the diagonal
    np.fill_diagonal(dist_cubed, np.inf)
    
    # dR_i x dR_j
    cross_prod = np.cross(dR[:, None, :], dR[None, :, :])
    
    # Numerator of Gauss integral: (dR_i x dR_j) . (R_i - R_j)
    numerator = np.sum(cross_prod * R_diff, axis=-1)
    
    integrand = numerator / dist_cubed
    
    # Total writhe
    writhe_total = (1.0 / (4.0 * np.pi)) * np.sum(integrand)
    
    # Local entanglement saliency
    local_entanglement = np.sum(integrand, axis=1)
    local_saliency_raw = np.abs(local_entanglement)
    
    min_val = np.min(local_saliency_raw)
    max_val = np.max(local_saliency_raw)
    
    if max_val > min_val:
        saliency_normalized = (local_saliency_raw - min_val) / (max_val - min_val)
    else:
        saliency_normalized = np.zeros_like(local_saliency_raw) + 0.5
        
    saliency_dict = {nodes[i]["id"]: float(saliency_normalized[i]) for i in range(N)}
    
    return float(writhe_total), saliency_dict

def generate_torus_knot(p: int, q: int, num_points: int = 200) -> dict:
    """
    Generate 3D coordinates and edges for a (p, q)-torus knot.
    """
    t = np.linspace(0, 2 * np.pi, num_points, endpoint=False)
    
    r = np.cos(q * t) + 2
    x = r * np.cos(p * t) * 50
    y = r * np.sin(p * t) * 50
    z = -np.sin(q * t) * 50
    
    nodes = []
    for i in range(num_points):
        nodes.append({
            "id": i,
            "fx": float(x[i]),
            "fy": float(y[i]),
            "fz": float(z[i])
        })
        
    edges = [[i, (i + 1) % num_points] for i in range(num_points)]
    
    crossing_number = min(p * (q - 1), q * (p - 1))
    
    writhe, saliency = compute_gauss_linking_integral(nodes)
    
    return {
        "nodes": nodes,
        "edges": edges,
        "invariants": {
            "crossing_number": int(crossing_number),
            "p": p,
            "q": q,
            "type": "Torus Knot",
            "writhe": writhe
        },
        "saliency_scores": saliency
    }
