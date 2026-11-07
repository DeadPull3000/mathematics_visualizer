"use client";

import React from "react";
import { Domain } from "@/types/domain";
import { MathResponse } from "@/lib/api";
import GraphVisualizer, { ViewMode } from "@/components/GraphVisualizer";

export interface ResultViewProps {
  result: MathResponse;
  domain: Domain;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  onEdgeRemove?: (source: string | number, target: string | number) => void;
  deletedEdges?: (string | number)[][];
}

export function ResultView({
  result,
  domain,
  viewMode,
  setViewMode,
  onEdgeRemove,
  deletedEdges,
}: ResultViewProps) {
  const m = result.metadata;
  const densityColor = m.density > 0.7 ? "#C05640" : m.density > 0.3 ? "#D19E4A" : "#6B8075";
  const densityPct = (m.density * 100).toFixed(1);
  const planarLabel =
    m.is_planar === null ? "Skipped (|E| > 1 000)" : m.is_planar ? "Yes ✓" : "No ✗";
  const planarColor = m.is_planar === null ? "#888C8E" : m.is_planar ? "#6B8075" : "#C05640";

  const betti = result.topology?.betti_numbers ?? [];
  const beta1 = betti[1] ?? 0;
  const beta2 = betti[2] ?? 0;

  const rows = [
    { name: "Vertices |V|", value: m.num_nodes, color: "#D19E4A", desc: "Cardinality of the vertex set" },
    { name: "Edges |E|", value: m.num_edges, color: "#C05640", desc: "Cardinality of the edge set" },
    {
      name: "Connected",
      value: m.is_connected ? "Yes ✓" : "No ✗",
      color: m.is_connected ? "#6B8075" : "#C05640",
      desc: "All vertices reachable from each other",
    },
    {
      name: "β₀ Components",
      value: m.num_connected_components,
      color: m.num_connected_components === 1 ? "#6B8075" : "#D19E4A",
      desc: "0th Betti number — path-connected components",
    },
    {
      name: "β₁ Cycles (Holes)",
      value: beta1,
      color: beta1 === 0 ? "#888C8E" : "#C05640",
      desc: "1st Betti number — 1D loops / tunnels",
    },
    {
      name: "β₂ Voids (Bubbles)",
      value: beta2,
      color: beta2 === 0 ? "#888C8E" : "#D19E4A",
      desc: "2nd Betti number — 2D enclosed voids",
    },
    { name: "Density", value: `${densityPct}%`, color: densityColor, desc: "2|E| / (|V|(|V|−1))  ∈ [0, 1]" },
    { name: "Planar", value: planarLabel, color: planarColor, desc: "Boyer–Myrvold planarity test" },
  ];

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Nodes", value: m.num_nodes, color: "#D19E4A" },
          { label: "Edges", value: m.num_edges, color: "#C05640" },
          { label: "Components", value: m.num_connected_components, color: "#6B8075" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: "#1C1F21",
              border: "1px solid #2C3133",
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: s.color,
                fontSize: 26,
                fontWeight: 700,
                fontFamily: "'Georgia', serif",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                color: "#888C8E",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Density bar */}
      <div
        style={{
          background: "#1C1F21",
          border: "1px solid #2C3133",
          borderRadius: 10,
          padding: "14px 18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span
            style={{
              color: "#888C8E",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Graph Density
          </span>
          <span
            style={{
              color: densityColor,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {densityPct}%
          </span>
        </div>
        <div style={{ height: 6, background: "#2C3133", borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${densityPct}%`,
              background: `linear-gradient(90deg, ${densityColor}80, ${densityColor})`,
              borderRadius: 3,
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <div style={{ color: "#888C8E", fontSize: 10, marginTop: 6 }}>
          2|E| / (|V|(|V|−1)) — 0 = empty, 1 = complete graph
        </div>
      </div>

      {/* Invariants table */}
      <div
        style={{
          border: "1px solid #2C3133",
          borderRadius: 10,
          background: "#1C1F21",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2C3133" }}>
              {["Invariant", "Value", "Mathematical Meaning"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    color: "#888C8E",
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textAlign: "left",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.name}
                style={{
                  borderBottom: i < rows.length - 1 ? "1px solid #2C3133" : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "#22262850";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                }}
              >
                <td
                  style={{
                    padding: "11px 14px",
                    color: "#E6E4DF",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.name}
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span
                    style={{
                      background: "#2C3133",
                      color: row.color,
                      borderRadius: 5,
                      padding: "3px 10px",
                      fontFamily: "'Courier New', monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {String(row.value)}
                  </span>
                </td>
                <td style={{ padding: "11px 14px", color: "#888C8E", fontSize: 11, lineHeight: 1.5 }}>
                  {row.desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 3D Force-Directed Graph ─────────────────────────────── */}
      <div
        style={{
          border: "1px solid #2C3133",
          borderRadius: 10,
          background: "#0F1113",
          padding: "14px 14px 10px",
        }}
      >
        {/* Header row with title + toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              color: "#888C8E",
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            1-Skeleton · 3D Force Graph (WebGL)
          </div>
          {/* View Mode Toggle — premium segmented control */}
          <div
            id="view-mode-toggle"
            style={{
              display: "flex",
              background: "#1C1F21",
              border: "1px solid #2C3133",
              borderRadius: 8,
              padding: 3,
              gap: 2,
            }}
          >
            {(["spectral", "saliency"] as const).map((mode) => {
              const isActive = viewMode === mode;
              const labels: Record<string, string> = {
                spectral: "⟡ Spectral Clusters",
                saliency: "◈ Gradient Saliency",
              };
              return (
                <button
                  key={mode}
                  id={`view-toggle-${mode}`}
                  onClick={() => setViewMode(mode)}
                  style={{
                    background: isActive
                      ? mode === "saliency"
                        ? "#C05640"
                        : "#6B8075"
                      : "transparent",
                    border: "none",
                    borderRadius: 6,
                    color: isActive ? "#E6E4DF" : "#888C8E",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 400,
                    letterSpacing: "0.04em",
                    padding: "5px 12px",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLButtonElement).style.color = "#E6E4DF";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLButtonElement).style.color = "#888C8E";
                  }}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>
        {/* Active view legend pill */}
        <div style={{ marginBottom: 8 }}>
          {viewMode === "spectral" ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {[
                { color: "#C05640", label: "Partition A  (Fiedler > 0)" },
                { color: "#6B8075", label: "Partition B  (Fiedler < 0)" },
                { color: "#D19E4A", label: "Bridge / Isolated" },
              ].map(({ color, label }) => (
                <span
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 9,
                    color: "#888C8E",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: color,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {[
                { color: "#C05640", label: "High Saliency  (> 0.6)" },
                { color: "#D19E4A", label: "Moderate  (0.3–0.6)" },
                { color: "#888C8E", label: "Low  (< 0.3)" },
              ].map(({ color, label }) => (
                <span
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 9,
                    color: "#888C8E",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: color,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {label}
                </span>
              ))}
              <span style={{ fontSize: 9, color: "#888C8E", marginLeft: 4 }}>
                · node size ∝ saliency score
              </span>
            </div>
          )}
        </div>
        <GraphVisualizer
          nodes={result.nodes}
          edges={result.edges}
          deletedEdges={deletedEdges}
          fiedlerVector={result.topology?.fiedler_vector}
          saliencyScores={result.topology?.saliency_scores}
          viewMode={viewMode}
          height={380}
          onEdgeRemove={onEdgeRemove}
        />
      </div>

      {/* ── Spectral + Betti Stats Grid ─────────────────────────── */}
      {result.topology && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {/* Algebraic Connectivity */}
          <div
            style={{
              background: "#1C1F21",
              border: "1px solid #2C3133",
              borderRadius: 10,
              padding: "14px 18px",
            }}
          >
            <div
              style={{
                color: "#888C8E",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Algebraic Connectivity  λ₂
            </div>
            <div
              style={{
                color: "#D19E4A",
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "'Georgia', serif",
                marginBottom: 4,
              }}
            >
              {result.topology.algebraic_connectivity.toFixed(4)}
            </div>
            <div style={{ color: "#888C8E", fontSize: 10, lineHeight: 1.6 }}>
              λ₂ = 0 → disconnected graph
              <br />
              λ₂ ↑ → more robust connectivity
            </div>
          </div>

          {/* Laplacian Spectrum */}
          <div
            style={{
              background: "#1C1F21",
              border: "1px solid #2C3133",
              borderRadius: 10,
              padding: "14px 18px",
            }}
          >
            <div
              style={{
                color: "#888C8E",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Laplacian Spectrum  (first 5 eigenvalues)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {result.topology.laplacian_eigenvalues.slice(0, 5).map((ev, i) => (
                <span
                  key={i}
                  style={{
                    background: i === 0 ? "#6B807520" : i === 1 ? "#D19E4A20" : "#2C3133",
                    border: `1px solid ${i === 0 ? "#6B8075" : i === 1 ? "#D19E4A" : "#2C3133"}`,
                    color: i === 0 ? "#6B8075" : i === 1 ? "#D19E4A" : "#E6E4DF",
                    borderRadius: 5,
                    padding: "3px 10px",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {ev.toFixed(4)}
                </span>
              ))}
            </div>
            <div style={{ color: "#888C8E", fontSize: 10, lineHeight: 1.6 }}>
              <span style={{ color: "#6B8075" }}>λ₁ = 0</span> always ·{" "}
              <span style={{ color: "#D19E4A" }}>λ₂</span> = Fiedler value
            </div>
          </div>

          {/* Topological Signature (Betti numbers) */}
          <div
            style={{
              background: "#1C1F21",
              border: "1px solid #2C3133",
              borderRadius: 10,
              padding: "14px 18px",
            }}
          >
            <div
              style={{
                color: "#888C8E",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Topological Signature (Betti)
            </div>
            <div
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: 13,
                marginBottom: 10,
                color: "#E6E4DF",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "#888C8E" }}>(β₀, β₁, β₂) =</span>{" "}
              <span style={{ color: "#D19E4A", fontWeight: 700, fontSize: 18 }}>
                ({result.topology.betti_numbers[0] ?? 0},{" "}
                {result.topology.betti_numbers[1] ?? 0},{" "}
                {result.topology.betti_numbers[2] ?? 0})
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "β₀", desc: "Components", val: result.topology.betti_numbers[0] ?? 0, color: "#6B8075" },
                {
                  label: "β₁",
                  desc: "1D Holes",
                  val: result.topology.betti_numbers[1] ?? 0,
                  color: result.topology.betti_numbers[1] ? "#C05640" : "#888C8E",
                },
                {
                  label: "β₂",
                  desc: "2D Voids",
                  val: result.topology.betti_numbers[2] ?? 0,
                  color: result.topology.betti_numbers[2] ? "#D19E4A" : "#888C8E",
                },
              ].map(({ label, desc, val, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      color,
                      fontFamily: "'Courier New', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      minWidth: 20,
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ color: "#888C8E", fontSize: 10 }}>{desc}</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "#2C3133",
                      color,
                      borderRadius: 4,
                      padding: "1px 8px",
                      fontFamily: "'Courier New', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
