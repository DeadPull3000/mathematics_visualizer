"use client";

import React, { useState } from "react";
import { processGNNInspect, GNNInspectResponse } from "@/lib/api";

interface GNNPlaygroundProps {
  nodes: (number | string)[];
  edges: (number | string)[][];
  onSaliencyUpdate?: (saliency: Record<string, number>) => void;
}

export function GNNPlayground({ nodes, edges, onSaliencyUpdate }: GNNPlaygroundProps) {
  const [activeModel, setActiveModel] = useState<"GCN" | "GAT" | "GraphSAGE">("GCN");
  const [data, setData] = useState<GNNInspectResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const switchModel = async (model: "GCN" | "GAT" | "GraphSAGE") => {
    setActiveModel(model);
    try {
      setLoading(true);
      const res = await processGNNInspect({
        nodes,
        edges,
        model_type: model,
      });
      setData(res);
      if (onSaliencyUpdate && res.saliency_scores) {
        onSaliencyUpdate(res.saliency_scores);
      }
    } catch (err) {
      console.error("GNN inspection failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const models = [
    { id: "GCN" as const, name: "GCN", subtitle: "Kipf & Welling", desc: "Normalized symmetric Laplacian aggregation: D̃^{-1/2} Ã D̃^{-1/2}" },
    { id: "GAT" as const, name: "GAT", subtitle: "Veličković et al.", desc: "Learned self-attention coefficients: softmax(LeakyReLU(a^T [Wh_i || Wh_j]))" },
    { id: "GraphSAGE" as const, name: "GraphSAGE", subtitle: "Hamilton et al.", desc: "Neighborhood mean pooling with skip-connection: W · [h_i || MEAN(h_j)]" },
  ];

  return (
    <div
      style={{
        background: "#1C1F21",
        border: "1px solid #2C3133",
        borderRadius: 10,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div
            style={{
              color: "#C05640",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Geometric Deep Learning · GNN Architecture Explorer
          </div>
          <div style={{ color: "#888C8E", fontSize: 11, marginTop: 2 }}>
            Compare structural gradient saliency & layer representations across canonical message passing schemes
          </div>
        </div>
        {loading && (
          <span style={{ color: "#D19E4A", fontSize: 10, fontFamily: "'Courier New', monospace" }}>
            PROPAGATING...
          </span>
        )}
      </div>

      {/* Model selector buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {models.map((m) => {
          const isSelected = activeModel === m.id;
          return (
            <button
              key={m.id}
              onClick={() => switchModel(m.id)}
              disabled={loading}
              style={{
                background: isSelected ? "#2C3133" : "#16191B",
                border: `1px solid ${isSelected ? "#C05640" : "#2C3133"}`,
                borderRadius: 8,
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: isSelected ? "#E6E4DF" : "#888C8E", fontWeight: 700, fontSize: 12 }}>
                  {m.name}
                </span>
                <span style={{ fontSize: 9, color: isSelected ? "#C05640" : "#888C8E", fontFamily: "'Courier New', monospace" }}>
                  {isSelected ? "● ACTIVE" : "SELECT"}
                </span>
              </div>
              <div style={{ color: "#888C8E", fontSize: 9, marginTop: 3 }}>{m.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Architecture mechanism formula */}
      <div
        style={{
          background: "#0F1113",
          border: "1px solid #2C3133",
          borderRadius: 6,
          padding: "8px 12px",
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          color: "#D19E4A",
        }}
      >
        {models.find((m) => m.id === activeModel)?.desc}
      </div>

      {/* If GAT is active, show attention weights */}
      {activeModel === "GAT" && data && data.attention_weights.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <div style={{ fontSize: 10, color: "#888C8E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Extracted Edge Attention Coefficients (Top α_ij):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 90, overflowY: "auto" }}>
            {data.attention_weights.slice(0, 12).map((aw, idx) => (
              <div
                key={idx}
                style={{
                  background: "#16191B",
                  border: "1px solid #2C3133",
                  borderRadius: 4,
                  padding: "3px 8px",
                  fontSize: 10,
                  fontFamily: "'Courier New', monospace",
                  color: "#E6E4DF",
                }}
              >
                ({aw.source} → {aw.target}):{" "}
                <span style={{ color: "#C05640", fontWeight: 700 }}>
                  {aw.weight.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latent 2D Projection */}
      {data && data.embeddings_2d && Object.keys(data.embeddings_2d).length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 10, color: "#888C8E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Layer 1 Hidden State PCA Projection (2D Coordinate Space):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 75, overflowY: "auto" }}>
            {Object.entries(data.embeddings_2d).slice(0, 10).map(([node, coords]) => (
              <div
                key={node}
                style={{
                  background: "#16191B",
                  border: "1px solid #2C3133",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontFamily: "'Courier New', monospace",
                  color: "#888C8E",
                }}
              >
                Node {node}:{" "}
                <span style={{ color: "#6B8075" }}>
                  [{coords[0].toFixed(2)}, {coords[1].toFixed(2)}]
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
