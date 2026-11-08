"""
Graph Neural Network Engine & Representation Playground (Phase 3)
=================================================================
Implements GCN (Kipf & Welling), GAT (Veličković et al.) with attention extraction,
and GraphSAGE (Hamilton et al.) with mean aggregation, layer embeddings projection,
and structural gradient saliency.
"""

from __future__ import annotations
import math
from typing import Any, Dict, List, Tuple
import networkx as nx
import numpy as np
import scipy.linalg as la
import torch
import torch.nn as nn
import torch.nn.functional as F


# ---------------------------------------------------------------------------
# 1. GCN Architecture (Kipf & Welling)
# ---------------------------------------------------------------------------
class GCNLayer(nn.Module):
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.W = nn.Linear(in_features, out_features, bias=False)
        nn.init.xavier_uniform_(self.W.weight)

    def forward(self, A_norm: torch.Tensor, X: torch.Tensor) -> torch.Tensor:
        # A_norm @ X @ W
        AX = torch.matmul(A_norm, X)
        return F.relu(self.W(AX))


class SaliencyGCN(nn.Module):
    def __init__(self, hidden_dim: int = 16):
        super().__init__()
        self.layer1 = GCNLayer(1, hidden_dim)
        self.layer2 = GCNLayer(hidden_dim, 1)

    def forward(self, A_norm: torch.Tensor, X: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        h1 = self.layer1(A_norm, X)
        out = self.layer2(A_norm, h1)
        return out, h1


# ---------------------------------------------------------------------------
# 2. GAT Architecture (Graph Attention Network)
# ---------------------------------------------------------------------------
class GATLayer(nn.Module):
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.W = nn.Linear(in_features, out_features, bias=False)
        self.a_src = nn.Parameter(torch.zeros(out_features, 1))
        self.a_dst = nn.Parameter(torch.zeros(out_features, 1))
        self.leaky_relu = nn.LeakyReLU(0.2)

        nn.init.xavier_uniform_(self.W.weight)
        nn.init.xavier_uniform_(self.a_src)
        nn.init.xavier_uniform_(self.a_dst)

    def forward(self, adj_mask: torch.Tensor, X: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        # X: [N, in_features]
        # h: [N, out_features]
        h = self.W(X)
        N = h.size(0)

        # Self-attention coefficients e_ij = LeakyReLU(a_src^T h_i + a_dst^T h_j)
        score_src = torch.matmul(h, self.a_src)  # [N, 1]
        score_dst = torch.matmul(h, self.a_dst)  # [N, 1]
        e = self.leaky_relu(score_src + score_dst.t())  # [N, N]

        # Mask non-edges with large negative value
        mask = (adj_mask > 0)
        e_masked = torch.where(mask, e, torch.full_like(e, -1e9))

        # Softmax over neighborhood
        alpha = F.softmax(e_masked, dim=1)  # [N, N]

        out = F.relu(torch.matmul(alpha, h))
        return out, alpha


class SaliencyGAT(nn.Module):
    def __init__(self, hidden_dim: int = 16):
        super().__init__()
        self.layer1 = GATLayer(1, hidden_dim)
        self.layer2 = GATLayer(hidden_dim, 1)

    def forward(self, adj_mask: torch.Tensor, X: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        h1, alpha1 = self.layer1(adj_mask, X)
        out, alpha2 = self.layer2(adj_mask, h1)
        return out, h1, alpha1


# ---------------------------------------------------------------------------
# 3. GraphSAGE Architecture (Mean Neighborhood Aggregation)
# ---------------------------------------------------------------------------
class GraphSAGELayer(nn.Module):
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.W = nn.Linear(in_features * 2, out_features, bias=False)
        nn.init.xavier_uniform_(self.W.weight)

    def forward(self, A_norm: torch.Tensor, X: torch.Tensor) -> torch.Tensor:
        # Neighborhood mean pooling
        neigh_mean = torch.matmul(A_norm, X)
        # Concatenate self with neighborhood
        concat = torch.cat([X, neigh_mean], dim=1)
        return F.relu(self.W(concat))


class SaliencyGraphSAGE(nn.Module):
    def __init__(self, hidden_dim: int = 16):
        super().__init__()
        self.layer1 = GraphSAGELayer(1, hidden_dim)
        self.layer2 = GraphSAGELayer(hidden_dim, 1)

    def forward(self, A_norm: torch.Tensor, X: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        h1 = self.layer1(A_norm, X)
        out = self.layer2(A_norm, h1)
        return out, h1


# ---------------------------------------------------------------------------
# Embedding 2D PCA Projection Utility
# ---------------------------------------------------------------------------
def _project_embeddings_2d(H_np: np.ndarray, nodes: list) -> Dict[Any, List[float]]:
    """Projects hidden features onto first 2 principal components."""
    N = H_np.shape[0]
    if N == 0:
        return {}
    if N <= 2:
        return {node: [round(float(i * 1.0), 4), 0.0] for i, node in enumerate(nodes)}

    # Center representations
    H_centered = H_np - np.mean(H_np, axis=0, keepdims=True)
    U, s, Vt = la.svd(H_centered, full_matrices=False)
    # 2D projection
    coords_2d = U[:, :2] * s[:2] if len(s) >= 2 else np.pad(U[:, :1] * s[:1], ((0, 0), (0, 1)))

    # Normalize to [-1, 1] range for visual plotting
    max_abs = np.max(np.abs(coords_2d))
    if max_abs > 1e-8:
        coords_2d = coords_2d / max_abs

    return {node: [round(float(coords_2d[i, 0]), 4), round(float(coords_2d[i, 1]), 4)] for i, node in enumerate(nodes)}


# ---------------------------------------------------------------------------
# Saliency Computation & Full GNN Inspection
# ---------------------------------------------------------------------------
def compute_gnn_comparison(G: nx.Graph, model_type: str = "GCN") -> dict:
    """
    Executes specified GNN architecture (GCN, GAT, or GraphSAGE), extracts
    layer representations, attention coefficients, and structural gradient saliency.
    """
    if G.number_of_nodes() == 0:
        return {
            "model_type": model_type,
            "saliency_scores": {},
            "attention_weights": [],
            "embeddings_2d": {},
        }

    nodes = list(G.nodes())
    n = len(nodes)
    node_to_idx = {node: i for i, node in enumerate(nodes)}

    # Adjacency matrix with self-loops
    A_np = nx.adjacency_matrix(G).toarray().astype(np.float32)
    A_np_loop = A_np + np.eye(n, dtype=np.float32)

    # Row-normalized adjacency
    deg = A_np_loop.sum(axis=1, keepdims=True)
    deg[deg == 0] = 1.0
    A_norm = A_np_loop / deg

    A_tensor = torch.tensor(A_norm, dtype=torch.float32)
    A_mask = torch.tensor(A_np_loop, dtype=torch.float32)
    X = torch.ones((n, 1), dtype=torch.float32, requires_grad=True)

    model_type_upper = model_type.upper()
    attention_list = []

    if "GAT" in model_type_upper:
        model = SaliencyGAT()
        model.eval()
        out, h1, alpha = model(A_mask, X)

        # Extract attention weights for existing edges
        alpha_np = alpha.detach().numpy()
        for u, v in G.edges():
            iu, iv = node_to_idx[u], node_to_idx[v]
            attention_list.append({
                "source": u,
                "target": v,
                "weight": round(float(alpha_np[iu, iv]), 4),
            })
            attention_list.append({
                "source": v,
                "target": u,
                "weight": round(float(alpha_np[iv, iu]), 4),
            })
        arch_name = "Graph Attention Network (GAT)"

    elif "SAGE" in model_type_upper:
        model = SaliencyGraphSAGE()
        model.eval()
        out, h1 = model(A_tensor, X)
        arch_name = "GraphSAGE (Mean Pooling)"

    else:
        model = SaliencyGCN()
        model.eval()
        out, h1 = model(A_tensor, X)
        arch_name = "Graph Convolutional Network (GCN)"

    # Compute gradient saliency
    loss = out.sum()
    loss.backward()

    grads = X.grad.abs().squeeze().numpy()
    if np.ndim(grads) == 0:
        grads = np.array([float(grads)])

    min_g, max_g = grads.min(), grads.max()
    if max_g > min_g:
        grads_norm = (grads - min_g) / (max_g - min_g)
    else:
        grads_norm = np.zeros_like(grads)

    saliency = {node: round(float(val), 4) for node, val in zip(nodes, grads_norm)}
    embeddings_2d = _project_embeddings_2d(h1.detach().numpy(), nodes)

    return {
        "model_type": arch_name,
        "saliency_scores": saliency,
        "attention_weights": attention_list,
        "embeddings_2d": embeddings_2d,
    }


def compute_gradient_saliency(G: nx.Graph) -> dict:
    """Backward-compatible entrypoint used across standard topology pipeline."""
    res = compute_gnn_comparison(G, model_type="GCN")
    return res["saliency_scores"]
