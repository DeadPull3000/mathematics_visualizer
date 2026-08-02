import torch
import torch.nn as nn
import numpy as np
import networkx as nx

class GCNLayer(nn.Module):
    def __init__(self, in_features, out_features):
        super(GCNLayer, self).__init__()
        self.W = nn.Linear(in_features, out_features, bias=False)
        self.relu = nn.ReLU()

    def forward(self, A, X):
        # A @ X @ W
        AX = torch.matmul(A, X)
        return self.relu(self.W(AX))

class SaliencyGCN(nn.Module):
    def __init__(self, num_nodes):
        super(SaliencyGCN, self).__init__()
        self.layer1 = GCNLayer(1, 16)
        self.layer2 = GCNLayer(16, 1)
        
        # Initialize weights with ones to ensure positive flow initially
        nn.init.ones_(self.layer1.W.weight)
        nn.init.ones_(self.layer2.W.weight)

    def forward(self, A, X):
        h = self.layer1(A, X)
        h = self.layer2(A, h)
        return h

def compute_gradient_saliency(G: nx.Graph) -> dict:
    """
    Computes Structural Saliency for each node using an untrained GCN.
    """
    if G.number_of_nodes() == 0:
        return {}

    try:
        nodes = list(G.nodes())
        n = len(nodes)
        
        # Create Adjacency matrix with self-loops
        A_np = nx.adjacency_matrix(G).toarray().astype(np.float32)
        A_np = A_np + np.eye(n, dtype=np.float32)
        
        # Row-normalize A
        deg = A_np.sum(axis=1, keepdims=True)
        # Avoid division by zero
        deg[deg == 0] = 1.0
        A_norm = A_np / deg
        
        A_tensor = torch.tensor(A_norm, dtype=torch.float32)
        
        # Initial node features (all ones)
        X = torch.ones((n, 1), dtype=torch.float32, requires_grad=True)
        
        # Model
        model = SaliencyGCN(n)
        model.eval() # Ensure deterministic behavior
        
        # Forward pass
        Z = model(A_tensor, X)
        
        # Aggregate
        loss = Z.sum()
        
        # Backward pass
        loss.backward()
        
        # Saliency extraction
        grads = X.grad.abs().squeeze().numpy()
        
        # Min-Max Normalization
        min_grad = grads.min()
        max_grad = grads.max()
        
        if max_grad > min_grad:
            grads_norm = (grads - min_grad) / (max_grad - min_grad)
        else:
            grads_norm = np.zeros_like(grads)
            
        # Map back to node IDs
        saliency_scores = {node: float(val) for node, val in zip(nodes, grads_norm)}
        return saliency_scores

    except Exception as e:
        print(f"Saliency computation failed: {e}")
        # Return neutral 0.5 for all nodes on failure
        return {node: 0.5 for node in G.nodes()}
