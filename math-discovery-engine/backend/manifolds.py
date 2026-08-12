import numpy as np
import networkx as nx
import scipy.linalg as la

def generate_manifold(shape: str, res: int = 15) -> dict:
    """
    Generate parametric meshes for Topology domain.
    """
    nodes = []
    G = nx.Graph()
    
    if shape.lower() == "sphere":
        theta = np.linspace(0, np.pi, res)
        phi = np.linspace(0, 2 * np.pi, res, endpoint=False)
        
        for i in range(res):
            for j in range(res):
                node_id = i * res + j
                x = np.sin(theta[i]) * np.cos(phi[j]) * 50
                y = np.sin(theta[i]) * np.sin(phi[j]) * 50
                z = np.cos(theta[i]) * 50
                
                nodes.append({
                    "id": node_id,
                    "fx": float(x),
                    "fy": float(y),
                    "fz": float(z)
                })
                G.add_node(node_id)
                
                # Edges
                # Horizontal (phi, wrap around)
                G.add_edge(node_id, i * res + (j + 1) % res)
                
                # Vertical (theta, no wrap over poles)
                if i < res - 1:
                    G.add_edge(node_id, (i + 1) * res + j)
                    
        euler_char = 2
        
    elif shape.lower() == "torus":
        u = np.linspace(0, 2 * np.pi, res, endpoint=False)
        v = np.linspace(0, 2 * np.pi, res, endpoint=False)
        
        c, a = 2, 1
        
        for i in range(res):
            for j in range(res):
                node_id = i * res + j
                x = (c + a * np.cos(v[j])) * np.cos(u[i]) * 50
                y = (c + a * np.cos(v[j])) * np.sin(u[i]) * 50
                z = a * np.sin(v[j]) * 50
                
                nodes.append({
                    "id": node_id,
                    "fx": float(x),
                    "fy": float(y),
                    "fz": float(z)
                })
                G.add_node(node_id)
                
                # Edges (wrap both ways)
                G.add_edge(node_id, i * res + (j + 1) % res)
                G.add_edge(node_id, ((i + 1) % res) * res + j)
                
        euler_char = 0
        
    else:
        raise ValueError(f"Unknown shape: {shape}")
        
    # Simplify graph to remove duplicate edges
    G = nx.Graph(G)
    
    edges_list = [[u, v] for u, v in G.edges()]
    num_vertices = G.number_of_nodes()
    num_edges = G.number_of_edges()
    
    # Compute Combinatorial Laplacian and harmonics
    L = nx.laplacian_matrix(G).todense()
    eigenvalues, eigenvectors = la.eigh(L)
    
    # 2nd non-zero eigenvector (Fiedler vector / spherical harmonic)
    # The first eigenvalue is 0
    harmonics_vec = eigenvectors[:, 1]
    
    harmonics = {node: float(val) for node, val in zip(G.nodes(), harmonics_vec)}
    
    return {
        "nodes": nodes,
        "edges": edges_list,
        "invariants": {
            "vertices": num_vertices,
            "edges": num_edges,
            "euler_characteristic": euler_char
        },
        "harmonics": harmonics
    }
