import numpy as np

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
    
    return {
        "nodes": nodes,
        "edges": edges,
        "invariants": {
            "crossing_number": int(crossing_number),
            "p": p,
            "q": q,
            "type": "Torus Knot"
        }
    }
