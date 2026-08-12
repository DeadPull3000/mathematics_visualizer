import numpy as np
import scipy.linalg as la


def compute_cotangent_laplacian(nodes: list[dict], faces: list[list[int]]) -> np.ndarray:
    """
    Computes the cotangent weight Laplacian matrix for a given triangular mesh.
    """
    N = len(nodes)
    V = np.zeros((N, 3))
    for node in nodes:
        V[node["id"]] = [node["fx"], node["fy"], node["fz"]]

    W = np.zeros((N, N))

    for face in faces:
        i, j, k = face
        
        # Edge i-j, opposite k
        u = V[i] - V[k]
        v = V[j] - V[k]
        cross_norm = np.linalg.norm(np.cross(u, v))
        cot_alpha = np.dot(u, v) / cross_norm if cross_norm > 1e-8 else 0.0
        W[i, j] += 0.5 * cot_alpha
        W[j, i] += 0.5 * cot_alpha
        
        # Edge j-k, opposite i
        u = V[j] - V[i]
        v = V[k] - V[i]
        cross_norm = np.linalg.norm(np.cross(u, v))
        cot_beta = np.dot(u, v) / cross_norm if cross_norm > 1e-8 else 0.0
        W[j, k] += 0.5 * cot_beta
        W[k, j] += 0.5 * cot_beta
        
        # Edge k-i, opposite j
        u = V[k] - V[j]
        v = V[i] - V[j]
        cross_norm = np.linalg.norm(np.cross(u, v))
        cot_gamma = np.dot(u, v) / cross_norm if cross_norm > 1e-8 else 0.0
        W[k, i] += 0.5 * cot_gamma
        W[i, k] += 0.5 * cot_gamma

    # Constrain weights to be non-negative for stability
    W = np.clip(W, 0.0, None)
    
    D = np.diag(np.sum(W, axis=1))
    L = D - W
    return L


def generate_manifold(shape: str, res: int = 15, deformation: str = "none") -> dict:
    """
    Generate parametric meshes for Topology domain.
    Outputs nodes, faces, edges, invariants, and cotangent laplacian harmonics.
    """
    nodes = []
    faces = []
    
    if shape.lower() == "sphere":
        theta = np.linspace(0, np.pi, res)
        phi = np.linspace(0, 2 * np.pi, res, endpoint=False)
        
        for i in range(res):
            for j in range(res):
                node_id = i * res + j
                x = np.sin(theta[i]) * np.cos(phi[j])
                y = np.sin(theta[i]) * np.sin(phi[j])
                z = np.cos(theta[i])
                
                if deformation == "stretch":
                    z *= 2.0
                elif deformation == "ripple":
                    z += 0.3 * np.sin(5 * x) * np.cos(5 * y)
                    
                x *= 50
                y *= 50
                z *= 50
                
                nodes.append({
                    "id": node_id,
                    "fx": float(x),
                    "fy": float(y),
                    "fz": float(z)
                })
        
        for i in range(res - 1):
            for j in range(res):
                A = i * res + j
                B = i * res + (j + 1) % res
                C = (i + 1) * res + j
                D = (i + 1) * res + (j + 1) % res
                
                faces.append([A, B, C])
                faces.append([B, D, C])
                
        euler_char = 2
        
    elif shape.lower() == "torus":
        u = np.linspace(0, 2 * np.pi, res, endpoint=False)
        v = np.linspace(0, 2 * np.pi, res, endpoint=False)
        
        c, a = 2, 1
        
        for i in range(res):
            for j in range(res):
                node_id = i * res + j
                x = (c + a * np.cos(v[j])) * np.cos(u[i])
                y = (c + a * np.cos(v[j])) * np.sin(u[i])
                z = a * np.sin(v[j])
                
                if deformation == "stretch":
                    z *= 2.0
                elif deformation == "ripple":
                    z += 0.3 * np.sin(5 * x) * np.cos(5 * y)
                    
                x *= 50
                y *= 50
                z *= 50
                
                nodes.append({
                    "id": node_id,
                    "fx": float(x),
                    "fy": float(y),
                    "fz": float(z)
                })
                
        for i in range(res):
            for j in range(res):
                A = i * res + j
                B = i * res + (j + 1) % res
                C = ((i + 1) % res) * res + j
                D = ((i + 1) % res) * res + (j + 1) % res
                
                faces.append([A, B, C])
                faces.append([B, D, C])
                
        euler_char = 0
        
    else:
        raise ValueError(f"Unknown shape: {shape}")
        
    # Extract unique edges from faces
    edges_set = set()
    for face in faces:
        for u, v in [(face[0], face[1]), (face[1], face[2]), (face[2], face[0])]:
            if u > v:
                u, v = v, u
            edges_set.add((u, v))
            
    edges_list = [list(e) for e in edges_set]
    num_vertices = len(nodes)
    num_edges = len(edges_list)
    
    # Compute Cotangent Laplacian and harmonics
    L = compute_cotangent_laplacian(nodes, faces)
    eigenvalues, eigenvectors = la.eigh(L)
    
    # 2nd non-zero eigenvector
    harmonics_vec = eigenvectors[:, 1]
    
    harmonics = {node["id"]: float(val) for node, val in zip(nodes, harmonics_vec)}
    
    return {
        "nodes": nodes,
        "edges": edges_list,
        "faces": faces,
        "invariants": {
            "vertices": num_vertices,
            "edges": num_edges,
            "euler_characteristic": euler_char
        },
        "harmonics": harmonics
    }
