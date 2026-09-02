import networkx as nx
import numpy as np
import random

def generate_batch_data(num_samples: int = 100) -> list[dict]:
    results = []
    for i in range(num_samples):
        N = random.randint(5, 30)
        p = random.uniform(0.05, 0.95)
        G = nx.erdos_renyi_graph(N, p)
        
        vertices = G.number_of_nodes()
        edges = G.number_of_edges()
        density = nx.density(G)
        betti_0 = nx.number_connected_components(G)
        
        L = nx.laplacian_matrix(G).todense()
        eigenvalues = np.sort(np.linalg.eigvalsh(L))
        alg_conn = eigenvalues[1] if len(eigenvalues) > 1 else 0.0
        alg_conn = round(float(alg_conn), 4)
        
        results.append({
            "id": i,
            "vertices": vertices,
            "edges": edges,
            "density": round(float(density), 4),
            "algebraic_connectivity": alg_conn,
            "betti_0": betti_0
        })
    return results
