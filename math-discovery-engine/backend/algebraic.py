import numpy as np
import numexpr as ne
from skimage.measure import marching_cubes

def generate_algebraic_variety(formula: str, res: int = 30, bounds: float = 3.0) -> dict:
    """
    Evaluates an implicit polynomial equation F(x, y, z) = 0 and extracts its
    isosurface using the Marching Cubes algorithm.
    """
    # 1. Generate 3D grid
    x = np.linspace(-bounds, bounds, res)
    y = np.linspace(-bounds, bounds, res)
    z = np.linspace(-bounds, bounds, res)
    
    # We use indexing='ij' to match standard marching_cubes expectations
    X, Y, Z = np.meshgrid(x, y, z, indexing='ij')
    
    # 2. Evaluate the formula using numexpr
    local_dict = {'x': X, 'y': Y, 'z': Z}
    try:
        # V is a 3D numpy array of shape (res, res, res)
        V = ne.evaluate(formula, local_dict=local_dict)
    except Exception as e:
        raise ValueError(f"Failed to evaluate formula: {e}")
        
    # 3. Extract isosurface at level=0.0
    try:
        verts, faces, normals, values = marching_cubes(V, level=0.0)
    except ValueError as e:
        raise ValueError("No zero-level surface found within the specified bounds.") from e
        
    # verts contains indices into the 3D grid [0, res-1]
    # 4. Map them back to the actual [-bounds, bounds] mathematical coordinates
    # For a grid of size `res`, index `i` maps to:
    # x_val = -bounds + (i / (res - 1)) * (2 * bounds)
    scale_factor = (2.0 * bounds) / (res - 1)
    
    # Mathematical coordinates
    math_verts = -bounds + verts * scale_factor
    
    # Scale coordinates by 20 for 3D viewer (fx, fy, fz)
    display_verts = math_verts * 20.0
    
    # 5. Calculate Singularities (gradient magnitude of V)
    # np.gradient returns a list of 3 arrays (gradient along axis 0, 1, 2)
    grad_x, grad_y, grad_z = np.gradient(V)
    
    # For each vertex (which are floating point indices into V), we can grab the nearest grid point
    # or interpolate. Nearest grid point is easiest:
    nearest_indices = np.round(verts).astype(int)
    # Clip to be safe
    nearest_indices = np.clip(nearest_indices, 0, res - 1)
    
    idx_x = nearest_indices[:, 0]
    idx_y = nearest_indices[:, 1]
    idx_z = nearest_indices[:, 2]
    
    # Gradients at these points
    gx = grad_x[idx_x, idx_y, idx_z]
    gy = grad_y[idx_x, idx_y, idx_z]
    gz = grad_z[idx_x, idx_y, idx_z]
    
    mag = np.sqrt(gx**2 + gy**2 + gz**2)
    
    # Singularity Score = 1.0 / (1.0 + mag)
    raw_scores = 1.0 / (1.0 + mag)
    
    # Normalize scores to be between 0.0 and 1.0 (though it's already bounded, it might not span the range)
    min_score = np.min(raw_scores)
    max_score = np.max(raw_scores)
    
    if max_score > min_score:
        scores = (raw_scores - min_score) / (max_score - min_score)
    else:
        scores = np.zeros_like(raw_scores)
        
    saliency_scores = {int(i): float(scores[i]) for i in range(len(verts))}
    
    # 6. Create nodes
    nodes = []
    for i, v in enumerate(display_verts):
        nodes.append({
            "id": int(i),
            "fx": float(v[0]),
            "fy": float(v[1]),
            "fz": float(v[2])
        })
        
    # 7. Create faces and edges
    faces_list = []
    edges_set = set()
    
    for face in faces:
        v0, v1, v2 = int(face[0]), int(face[1]), int(face[2])
        faces_list.append([v0, v1, v2])
        
        # Add edges (sorted to avoid duplicates in opposite directions)
        e1 = tuple(sorted((v0, v1)))
        e2 = tuple(sorted((v1, v2)))
        e3 = tuple(sorted((v2, v0)))
        
        edges_set.add(e1)
        edges_set.add(e2)
        edges_set.add(e3)
        
    edges_list = [[e[0], e[1]] for e in edges_set]
    
    return {
        "nodes": nodes,
        "faces": faces_list,
        "edges": edges_list,
        "invariants": {
            "num_vertices": len(nodes),
            "num_faces": len(faces_list)
        },
        "saliency_scores": saliency_scores
    }
