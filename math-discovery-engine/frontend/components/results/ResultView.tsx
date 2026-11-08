"use client";

import React from "react";
import { Domain } from "@/types/domain";
import { MathResponse } from "@/lib/api";
import GraphVisualizer, { ViewMode } from "@/components/GraphVisualizer";
import { generateLaTeXTable } from "@/lib/exportUtils";
import { ProfessorNotes } from "@/components/ProfessorNotes";
import { GNNPlayground } from "@/components/GNNPlayground";
import { FrontiersInspector } from "@/components/FrontiersInspector";

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

  const [copiedLatex, setCopiedLatex] = React.useState(false);
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

      {/* Graph Family & Metric Classification Strip */}
      {result.topology?.graph_family && (
        <div
          style={{
            background: "#16191B",
            border: "1px solid #2C3133",
            borderRadius: 10,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <span style={{ color: "#888C8E", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Graph Family:{" "}
            </span>
            <span style={{ color: "#D19E4A", fontWeight: 700, fontSize: 13, fontFamily: "'Georgia', serif" }}>
              {result.topology.graph_family.family_name ?? "General Graph"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {result.topology.graph_family.is_tree && (
              <span style={{ background: "#6B807530", color: "#6B8075", border: "1px solid #6B8075", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                TREE
              </span>
            )}
            {result.topology.graph_family.is_bipartite && (
              <span style={{ background: "#D19E4A30", color: "#D19E4A", border: "1px solid #D19E4A", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                BIPARTITE
              </span>
            )}
            {result.topology.graph_family.is_eulerian && (
              <span style={{ background: "#C0564030", color: "#C05640", border: "1px solid #C05640", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                EULERIAN
              </span>
            )}
            {result.topology.graph_family.girth !== null && result.topology.graph_family.girth !== undefined && (
              <span style={{ background: "#2C3133", color: "#E6E4DF", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontFamily: "'Courier New', monospace" }}>
                Girth: {result.topology.graph_family.girth}
              </span>
            )}
            {result.topology.graph_family.diameter !== null && result.topology.graph_family.diameter !== undefined && (
              <span style={{ background: "#2C3133", color: "#E6E4DF", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontFamily: "'Courier New', monospace" }}>
                Diam: {result.topology.graph_family.diameter}
              </span>
            )}
            {result.topology.graph_family.clustering_coefficient !== undefined && (
              <span style={{ background: "#2C3133", color: "#E6E4DF", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontFamily: "'Courier New', monospace" }}>
                Clustering: {result.topology.graph_family.clustering_coefficient}
              </span>
            )}
          </div>
        </div>
      )}

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
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid #2C3133",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#16191B",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#888C8E", fontSize: 10, letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase" }}>
              Topological Invariants Ledger
            </span>
            {(result._cacheStatus || result._latencyMs !== undefined) && (
              <span
                style={{
                  background: result._cacheStatus === "HIT" ? "#6B807530" : "#2C313380",
                  border: `1px solid ${result._cacheStatus === "HIT" ? "#6B8075" : "#2C3133"}`,
                  borderRadius: 4,
                  padding: "2px 7px",
                  fontSize: 9,
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  color: result._cacheStatus === "HIT" ? "#6B8075" : "#888C8E",
                }}
                title="Response served from sub-millisecond calculation cache"
              >
                {result._cacheStatus === "HIT" ? "⚡ CACHE HIT" : "⚡ COMPUTED"}{" "}
                {result._latencyMs?.toFixed(1)}ms
              </span>
            )}
          </div>
          <button
            onClick={() => {
              const tableRows = rows.map((r) => ({
                name: r.name,
                formula: r.name.includes("|V|") ? "|V|" : r.name.includes("|E|") ? "|E|" : r.name.includes("β₀") ? "\\beta_0" : r.name.includes("β₁") ? "\\beta_1" : r.name.includes("β₂") ? "\\beta_2" : r.name,
                value: String(r.value),
              }));
              const tex = generateLaTeXTable("Graph_Invariants", tableRows);
              navigator.clipboard.writeText(tex);
              setCopiedLatex(true);
              setTimeout(() => setCopiedLatex(false), 2000);
            }}
            style={{
              background: copiedLatex ? "#6B8075" : "#2C313380",
              border: "1px solid #2C3133",
              borderRadius: 5,
              color: copiedLatex ? "#141617" : "#E6E4DF",
              fontSize: 10,
              fontWeight: 700,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'Courier New', monospace",
              transition: "all 0.2s ease",
            }}
          >
            {copiedLatex ? "✓ COPIED LATEX" : "📋 COPY LATEX"}
          </button>
        </div>
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

      {/* ── Spectral Expansion & Cheeger Bounds ── */}
      {result.topology?.cheeger_bounds && (
        <div
          style={{
            background: "#1C1F21",
            border: "1px solid #2C3133",
            borderRadius: 10,
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  color: "#D19E4A",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Cheeger Conductance Bounds & Spectral Gap
              </div>
              <div style={{ color: "#888C8E", fontSize: 11, marginTop: 2 }}>
                Cheeger Inequality: ν₁ / 2 ≤ h(G) ≤ √(2ν₁)
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  background: "#2C3133",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontFamily: "'Courier New', monospace",
                  color: "#6B8075",
                  fontWeight: 700,
                }}
              >
                h_lower: {result.topology.cheeger_bounds.lower?.toFixed(4) ?? "0.0000"}
              </div>
              <div
                style={{
                  background: "#2C3133",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontFamily: "'Courier New', monospace",
                  color: "#C05640",
                  fontWeight: 700,
                }}
              >
                h_upper: {result.topology.cheeger_bounds.upper?.toFixed(4) ?? "0.0000"}
              </div>
            </div>
          </div>
          <div style={{ color: "#E6E4DF", fontSize: 12, fontFamily: "'Georgia', serif" }}>
            Normalized Spectral Gap ν₁ ={" "}
            <span style={{ color: "#D19E4A", fontWeight: 700 }}>
              {result.topology.spectral_gap?.toFixed(4) ?? "0.0000"}
            </span>
          </div>
        </div>
      )}

      {/* ── Simplicial Homology H1 Generators & 2-Simplices ── */}
      {result.topology && (
        <div
          style={{
            background: "#1C1F21",
            border: "1px solid #2C3133",
            borderRadius: 10,
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              color: "#6B8075",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Simplicial Complex: 2-Simplices & Non-Bounding Cycle Generators
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#888C8E" }}>
              Filled 2-Simplices (Triangles):{" "}
              <span style={{ color: "#E6E4DF", fontWeight: 700 }}>
                {result.topology.triangles?.length ?? 0}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#888C8E" }}>
              H₁ Homology Rank (Holes):{" "}
              <span style={{ color: "#C05640", fontWeight: 700 }}>
                {result.topology.betti_numbers[1] ?? 0}
              </span>
            </div>
          </div>

          {result.topology.h1_generators && result.topology.h1_generators.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, color: "#888C8E", marginBottom: 4 }}>
                Independent Non-Bounding 1-Cycle Generators (ker D₁ / im D₂):
              </div>
              {result.topology.h1_generators.map((gen, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0F1113",
                    border: "1px solid #2C3133",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 11,
                    color: "#D19E4A",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "#888C8E" }}>Generator #{idx + 1}:</span>
                  <span>[{gen.join(" → ")} → {gen[0]}]</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "#888C8E", fontStyle: "italic" }}>
              All 1-cycles boundary-fill completely into 2-simplices (no non-bounding 1-holes).
            </div>
          )}
        </div>
      )}

      {/* ── GNN Message Passing & Architecture Playground ── */}
      <GNNPlayground
        nodes={result.nodes}
        edges={result.edges}
        onSaliencyUpdate={(newSaliency) => {
          if (result.topology) {
            result.topology.saliency_scores = newSaliency;
          }
        }}
      />

      {/* ── Mathematical Frontiers (Ihara Zeta & Ollivier-Ricci Curvature) ── */}
      <FrontiersInspector
        nodes={result.nodes}
        edges={result.edges}
        initialIhara={result.topology?.ihara_zeta}
        initialRicci={result.topology?.ricci_curvature}
      />

      {/* ── Professor's Notes (Academic Commentary) ── */}
      <ProfessorNotes domain={domain.id} invariants={result as unknown as Record<string, unknown>} />
    </div>
  );
}
