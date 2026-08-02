"use client";

/**
 * frontend/app/page.tsx  (Step 2 — Data Ingestion & Representation Layer)
 * -------------------------------------------------------------------------
 * Color palette: "Chalk, Slate, and Terracotta"
 *   #141617  Obsidian Slate  (primary background)
 *   #1C1F21  Chalkboard Grey (cards, panels)
 *   #E6E4DF  Warm Alabaster  (primary text)
 *   #888C8E  Faded Lead      (muted text, labels)
 *   #2C3133  Slate Joint     (borders, dividers)
 *   #C05640  Terracotta      (active accent, errors)
 *   #D19E4A  Aged Ochre      (symmetry accent)
 *   #6B8075  Faded Sage      (stable accent, success)
 *
 * Step 2 changes vs Step 1:
 *   - All client-side parsing removed. Raw text sent directly to backend.
 *   - New `formulaText` state for the Formula tab.
 *   - New `fileContent` state: FileReader reads JSON files as raw strings.
 *   - handleDiscover routes (input_type, raw_data) based on active tab.
 *   - ResultView renders MathResponse.metadata:
 *       num_nodes, num_edges, density, is_connected,
 *       num_connected_components, is_planar.
 *   - 1-skeleton preview uses circular layout (no longer needs spring coords).
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  processObject,
  type InputType,
  type MathResponse,
  type TopologyMetadata,
  ApiError,
} from "@/lib/api";
import GraphVisualizer from "@/components/GraphVisualizer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Domain = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  defaultInputType: InputType;
  defaultRawData: string;
  color: string;
};

type InputMode = "upload" | "paste" | "formula";

// ---------------------------------------------------------------------------
// Domain definitions
// ---------------------------------------------------------------------------

const DOMAINS: Domain[] = [
  {
    id: "topology",
    label: "Topology",
    subtitle: "Surfaces & Manifolds",
    icon: "◎",
    defaultInputType: "edge_list",
    defaultRawData: "0 1\n1 2\n2 3\n3 0\n4 5\n5 6\n6 7\n7 4\n0 4\n1 5\n2 6\n3 7",
    color: "#6B8075",
  },
  {
    id: "combinatorics",
    label: "Combinatorics",
    subtitle: "Graphs & Networks",
    icon: "⬡",
    defaultInputType: "edge_list",
    defaultRawData: "0 1\n1 2\n2 3\n3 4\n4 0\n0 2",
    color: "#D19E4A",
  },
  {
    id: "knot",
    label: "Knot Theory",
    subtitle: "Links & Tangles",
    icon: "∞",
    defaultInputType: "formula",
    defaultRawData: "C_6",
    color: "#C05640",
  },
  {
    id: "circuit",
    label: "Complexity Theory",
    subtitle: "Boolean Circuits",
    icon: "⊕",
    defaultInputType: "formula",
    defaultRawData: "K_4",
    color: "#6B8075",
  },
  {
    id: "algebraic-geometry",
    label: "Algebraic Geometry",
    subtitle: "Varieties & Schemes",
    icon: "∿",
    defaultInputType: "formula",
    defaultRawData: "K_5",
    color: "#D19E4A",
  },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({
  selected,
  onSelect,
}: {
  selected: Domain;
  onSelect: (d: Domain) => void;
}) {
  return (
    <aside
      style={{
        width: 220, minWidth: 220, flexShrink: 0,
        background: "#1C1F21",
        borderRight: "1px solid #2C3133",
        display: "flex", flexDirection: "column",
        padding: "24px 0", overflowY: "auto",
      }}
    >
      <div style={{ padding: "0 20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>𝕄</span>
          <span style={{ color: "#E6E4DF", fontWeight: 700, fontSize: 14, letterSpacing: "0.02em", fontFamily: "'Georgia', serif" }}>
            Discovery Engine
          </span>
        </div>
        <span style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.08em" }}>VISUAL MATH · v0.2</span>
      </div>

      <div style={{ padding: "0 20px 12px", color: "#888C8E", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Mathematical Domain
      </div>

      {DOMAINS.map((d) => {
        const isActive = d.id === selected.id;
        return (
          <button
            key={d.id}
            id={`domain-btn-${d.id}`}
            onClick={() => onSelect(d)}
            style={{
              background: isActive ? "#222628" : "transparent",
              border: "none",
              borderLeft: isActive ? `2px solid ${d.color}` : "2px solid transparent",
              cursor: "pointer", padding: "12px 20px", textAlign: "left",
              transition: "all 0.15s ease", display: "flex", alignItems: "center", gap: 12,
            }}
            onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#1e2124"; }}
            onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <span style={{ fontSize: 18, width: 26, textAlign: "center", color: isActive ? d.color : "#888C8E", transition: "color 0.15s" }}>
              {d.icon}
            </span>
            <div>
              <div style={{ color: isActive ? "#E6E4DF" : "#888C8E", fontSize: 13, fontWeight: isActive ? 600 : 400, transition: "color 0.15s", letterSpacing: "0.01em" }}>
                {d.label}
              </div>
              <div style={{ color: "#888C8E", fontSize: 10, marginTop: 1 }}>{d.subtitle}</div>
            </div>
          </button>
        );
      })}

      <div style={{ marginTop: "auto", padding: "20px 20px 0", borderTop: "1px solid #2C3133" }}>
        <div style={{ color: "#888C8E", fontSize: 10, lineHeight: 1.6 }}>
          Paste an edge list, type a formula, or upload a NetworkX JSON file.
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Dropzone / Input
// ---------------------------------------------------------------------------

function Dropzone({
  domain, inputMode, setInputMode,
  pastedText, setPastedText,
  formulaText, setFormulaText,
  onFileLoad, isDragging, setIsDragging,
}: {
  domain: Domain;
  inputMode: InputMode;
  setInputMode: (m: InputMode) => void;
  pastedText: string;
  setPastedText: (v: string) => void;
  formulaText: string;
  setFormulaText: (v: string) => void;
  onFileLoad: (raw: string) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => onFileLoad(ev.target?.result as string);
    reader.readAsText(file);
  }, [onFileLoad]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, [readFile, setIsDragging]);

  const modes: { id: InputMode; label: string }[] = [
    { id: "upload", label: "Upload JSON" },
    { id: "paste", label: "Edge List" },
    { id: "formula", label: "Formula" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, paddingBottom: 16 }}>
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2C3133" }}>
        {modes.map((m) => (
          <button
            key={m.id} id={`tab-${m.id}`}
            onClick={() => setInputMode(m.id)}
            style={{
              background: "transparent", border: "none",
              borderBottom: inputMode === m.id ? `2px solid ${domain.color}` : "2px solid transparent",
              color: inputMode === m.id ? "#E6E4DF" : "#888C8E",
              cursor: "pointer", padding: "10px 18px", fontSize: 12,
              fontWeight: inputMode === m.id ? 600 : 400,
              letterSpacing: "0.04em", transition: "all 0.15s", marginBottom: -1,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Upload — FileReader stores raw JSON string */}
      {inputMode === "upload" && (
        <div
          id="dropzone-area"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            minHeight: 220,
            border: `1.5px dashed ${isDragging ? domain.color : "#2C3133"}`,
            borderRadius: 12, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer", gap: 12, transition: "all 0.2s ease",
            background: isDragging ? `${domain.color}08` : "transparent",
          }}
        >
          <div style={{ fontSize: 36, opacity: isDragging ? 1 : 0.5, transition: "opacity 0.2s" }}>
            {domain.icon}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#E6E4DF", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Drop your JSON file here
            </div>
            <div style={{ color: "#888C8E", fontSize: 12 }}>
              or click to browse · accepts{" "}
              <code style={{ background: "#2C3133", padding: "1px 6px", borderRadius: 4, fontSize: 11, color: domain.color }}>
                .json
              </code>{" "}
              in NetworkX node-link format
            </div>
          </div>
          <input
            ref={fileRef} type="file" id="file-input" accept=".json"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
          />
        </div>
      )}

      {/* Paste — edge_list */}
      {inputMode === "paste" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
            One edge per line, space or comma separated — e.g.{" "}
            <code style={{ color: domain.color, fontSize: 11 }}>0 1</code>
          </div>
          <textarea
            id="edge-list-input"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={"0 1\n1 2\n2 3\n3 0\n0 2"}
            style={{
              minHeight: 200, background: "#111315", border: "1px solid #2C3133",
              borderRadius: 10, color: "#E6E4DF",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 13, lineHeight: 1.7, padding: "14px 16px",
              resize: "vertical", outline: "none", transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.target.style.borderColor = domain.color; }}
            onBlur={(e) => { e.target.style.borderColor = "#2C3133"; }}
          />
        </div>
      )}

      {/* Formula */}
      {inputMode === "formula" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
            Enter a graph-theoretic formula
          </div>
          <input
            id="formula-input" type="text"
            value={formulaText}
            onChange={(e) => setFormulaText(e.target.value)}
            placeholder="e.g.  K_5  or  C_6  or  P_4"
            style={{
              background: "#111315", border: "1px solid #2C3133",
              borderRadius: 10, color: "#E6E4DF",
              fontFamily: "'Georgia', serif", fontSize: 20,
              padding: "16px 18px", outline: "none",
              transition: "border-color 0.15s", letterSpacing: "0.08em",
            }}
            onFocus={(e) => { e.target.style.borderColor = domain.color; }}
            onBlur={(e) => { e.target.style.borderColor = "#2C3133"; }}
          />
          <div style={{ background: "#111315", border: "1px solid #2C3133", borderRadius: 10, padding: "16px 18px", color: "#888C8E", fontSize: 12, lineHeight: 2 }}>
            <span style={{ color: domain.color, fontWeight: 600 }}>Supported graph families:</span><br />
            <code style={{ color: "#E6E4DF" }}>K_n</code> — Complete graph on n vertices (K₅ has 10 edges)<br />
            <code style={{ color: "#E6E4DF" }}>C_n</code> — Cycle graph on n vertices (C₆ is a hexagon)<br />
            <code style={{ color: "#E6E4DF" }}>P_n</code> — Path graph on n vertices (P₄ has 3 edges)
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Microscope — empty state
// ---------------------------------------------------------------------------

function EmptyMicroscope({ domain }: { domain: Domain }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 380 }}>
      <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ position: "absolute", borderRadius: "50%", border: `1px solid ${domain.color}`, width: i * 36, height: i * 36, opacity: 0.15 + i * 0.1, animation: `pulse ${1.8 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }} />
        ))}
        <span style={{ fontSize: 28, color: domain.color, opacity: 0.6, position: "relative", zIndex: 1 }}>{domain.icon}</span>
      </div>
      <div style={{ color: "#E6E4DF", fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Awaiting Mathematical Object</div>
      <div style={{ color: "#888C8E", fontSize: 12, lineHeight: 1.7 }}>
        Input a <span style={{ color: domain.color }}>{domain.label.toLowerCase()}</span> structure above and click{" "}
        <span style={{ color: domain.color, fontWeight: 600 }}>Discover Structure</span>.<br />
        The 1-skeleton and invariants will render here.
      </div>
      <div style={{ marginTop: 24, padding: "10px 16px", background: "#1C1F21", borderRadius: 8, border: "1px solid #2C3133", color: "#888C8E", fontSize: 11, lineHeight: 1.6 }}>
        🔬 1-skeleton · β₀ Betti number · Density · Planarity · Persistent homology (Step 3)
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Microscope — result view (renders MathResponse.metadata)
// ---------------------------------------------------------------------------

// Suppress unused-type warning — TopologyMetadata is used as a JSDoc anchor
type _TopologyMetadata = TopologyMetadata;

function ResultView({
  result,
  domain,
  viewMode,
  setViewMode,
  onEdgeRemove,
  deletedEdges,
}: {
  result: MathResponse;
  domain: Domain;
  viewMode: "spectral" | "saliency";
  setViewMode: (m: "spectral" | "saliency") => void;
  onEdgeRemove?: (source: string | number, target: string | number) => void;
  deletedEdges?: (string | number)[][];
}) {
  const m = result.metadata;
  const densityColor = m.density > 0.7 ? "#C05640" : m.density > 0.3 ? "#D19E4A" : "#6B8075";
  const densityPct = (m.density * 100).toFixed(1);
  const planarLabel = m.is_planar === null ? "Skipped (|E| > 1 000)" : m.is_planar ? "Yes ✓" : "No ✗";
  const planarColor = m.is_planar === null ? "#888C8E" : m.is_planar ? "#6B8075" : "#C05640";

  const betti = result.topology?.betti_numbers ?? [];
  const beta1 = betti[1] ?? 0;
  const beta2 = betti[2] ?? 0;

  const rows = [
    { name: "Vertices |V|", value: m.num_nodes, color: "#D19E4A", desc: "Cardinality of the vertex set" },
    { name: "Edges |E|", value: m.num_edges, color: "#C05640", desc: "Cardinality of the edge set" },
    { name: "Connected", value: m.is_connected ? "Yes ✓" : "No ✗", color: m.is_connected ? "#6B8075" : "#C05640", desc: "All vertices reachable from each other" },
    { name: "β₀ Components", value: m.num_connected_components, color: m.num_connected_components === 1 ? "#6B8075" : "#D19E4A", desc: "0th Betti number — path-connected components" },
    { name: "β₁ Cycles (Holes)", value: beta1, color: beta1 === 0 ? "#888C8E" : "#C05640", desc: "1st Betti number — 1D loops / tunnels" },
    { name: "β₂ Voids (Bubbles)", value: beta2, color: beta2 === 0 ? "#888C8E" : "#D19E4A", desc: "2nd Betti number — 2D enclosed voids" },
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
          <div key={s.label} style={{ flex: 1, background: "#1C1F21", border: "1px solid #2C3133", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ color: s.color, fontSize: 26, fontWeight: 700, fontFamily: "'Georgia', serif", lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div style={{ color: "#888C8E", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Density bar */}
      <div style={{ background: "#1C1F21", border: "1px solid #2C3133", borderRadius: 10, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#888C8E", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Graph Density</span>
          <span style={{ color: densityColor, fontSize: 12, fontWeight: 700, fontFamily: "'Courier New', monospace" }}>{densityPct}%</span>
        </div>
        <div style={{ height: 6, background: "#2C3133", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${densityPct}%`, background: `linear-gradient(90deg, ${densityColor}80, ${densityColor})`, borderRadius: 3, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ color: "#888C8E", fontSize: 10, marginTop: 6 }}>2|E| / (|V|(|V|−1)) — 0 = empty, 1 = complete graph</div>
      </div>

      {/* Invariants table */}
      <div style={{ border: "1px solid #2C3133", borderRadius: 10, background: "#1C1F21", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2C3133" }}>
              {["Invariant", "Value", "Mathematical Meaning"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", color: "#888C8E", fontWeight: 600, fontSize: 10, letterSpacing: "0.08em", textAlign: "left", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.name}
                style={{ borderBottom: i < rows.length - 1 ? "1px solid #2C3133" : "none", transition: "background 0.1s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#22262850"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
              >
                <td style={{ padding: "11px 14px", color: "#E6E4DF", fontWeight: 500, whiteSpace: "nowrap" }}>{row.name}</td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ background: "#2C3133", color: row.color, borderRadius: 5, padding: "3px 10px", fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {String(row.value)}
                  </span>
                </td>
                <td style={{ padding: "11px 14px", color: "#888C8E", fontSize: 11, lineHeight: 1.5 }}>{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 3D Force-Directed Graph ─────────────────────────────── */}
      <div style={{ border: "1px solid #2C3133", borderRadius: 10, background: "#0F1113", padding: "14px 14px 10px" }}>
        {/* Header row with title + toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ color: "#888C8E", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
                      ? mode === "saliency" ? "#C05640" : "#6B8075"
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
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#888C8E", letterSpacing: "0.04em" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
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
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#888C8E", letterSpacing: "0.04em" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                  {label}
                </span>
              ))}
              <span style={{ fontSize: 9, color: "#888C8E", marginLeft: 4 }}>· node size ∝ saliency score</span>
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
          <div style={{ background: "#1C1F21", border: "1px solid #2C3133", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ color: "#888C8E", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Algebraic Connectivity  λ₂
            </div>
            <div style={{ color: "#D19E4A", fontSize: 22, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 4 }}>
              {result.topology.algebraic_connectivity.toFixed(4)}
            </div>
            <div style={{ color: "#888C8E", fontSize: 10, lineHeight: 1.6 }}>
              λ₂ = 0 → disconnected graph<br />
              λ₂ ↑ → more robust connectivity
            </div>
          </div>

          {/* Laplacian Spectrum */}
          <div style={{ background: "#1C1F21", border: "1px solid #2C3133", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ color: "#888C8E", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
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
              <span style={{ color: "#6B8075" }}>λ₁ = 0</span> always · <span style={{ color: "#D19E4A" }}>λ₂</span> = Fiedler value
            </div>
          </div>

          {/* Topological Signature (Betti numbers) */}
          <div style={{ background: "#1C1F21", border: "1px solid #2C3133", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ color: "#888C8E", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Topological Signature (Betti)
            </div>
            {/* Tuple display: (β₀, β₁, β₂) = (n, n, n) */}
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, marginBottom: 10, color: "#E6E4DF", lineHeight: 1.5 }}>
              <span style={{ color: "#888C8E" }}>(β₀, β₁, β₂) =</span>{" "}
              <span style={{ color: "#D19E4A", fontWeight: 700, fontSize: 18 }}>
                ({(result.topology.betti_numbers[0] ?? 0)},{" "}
                 {(result.topology.betti_numbers[1] ?? 0)},{" "}
                 {(result.topology.betti_numbers[2] ?? 0)})
              </span>
            </div>
            {/* Per-number breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "β₀", desc: "Components",  val: result.topology.betti_numbers[0] ?? 0, color: "#6B8075" },
                { label: "β₁", desc: "1D Holes",     val: result.topology.betti_numbers[1] ?? 0, color: result.topology.betti_numbers[1] ? "#C05640" : "#888C8E" },
                { label: "β₂", desc: "2D Voids",     val: result.topology.betti_numbers[2] ?? 0, color: result.topology.betti_numbers[2] ? "#D19E4A" : "#888C8E" },
              ].map(({ label, desc, val, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color, fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 700, minWidth: 20 }}>{label}</span>
                  <span style={{ color: "#888C8E", fontSize: 10 }}>{desc}</span>
                  <span style={{ marginLeft: "auto", background: "#2C3133", color, borderRadius: 4, padding: "1px 8px", fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Microscope wrapper
// ---------------------------------------------------------------------------

function Microscope({
  result,
  domain,
  error,
  viewMode,
  setViewMode,
  onEdgeRemove,
  perturbationCount,
  deletedEdges,
}: {
  result: MathResponse | null;
  domain: Domain;
  error: string | null;
  viewMode: "spectral" | "saliency";
  setViewMode: (m: "spectral" | "saliency") => void;
  onEdgeRemove?: (source: string | number, target: string | number) => void;
  perturbationCount?: number;
  deletedEdges?: (string | number)[][];
}) {
  return (
    <div style={{ background: "#111315", border: "1px solid #2C3133", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 400 }}>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid #2C3133", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: domain.color, fontSize: 14 }}>◉</span>
          <span style={{ color: "#E6E4DF", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>STRUCTURE MICROSCOPE</span>
        </div>
        {result && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: "#6B807520", border: "1px solid #6B8075", color: "#6B8075", borderRadius: 6, padding: "2px 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>
              {result.metadata.num_nodes}V · {result.metadata.num_edges}E
            </span>
            {perturbationCount !== undefined && perturbationCount > 0 && (
              <span
                title={`${perturbationCount} edge${perturbationCount === 1 ? "" : "s"} removed by interactive perturbation`}
                style={{
                  background: "#C0564020",
                  border: "1px solid #C05640",
                  color: "#C05640",
                  borderRadius: 6,
                  padding: "2px 10px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  animation: "pulse 1.8s ease-in-out 1",
                }}
              >
                −{perturbationCount}E perturbed
              </span>
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: error || !result ? "center" : "flex-start", justifyContent: error || !result ? "center" : "flex-start", padding: 24, overflowY: "auto" }}>
        {error ? (
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
            <div style={{ color: "#C05640", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Parse / Computation Error</div>
            <div style={{ color: "#888C8E", fontSize: 12, lineHeight: 1.7, background: "#1C1F21", border: "1px solid #C0564030", borderRadius: 8, padding: "12px 16px", fontFamily: "'Courier New', monospace", textAlign: "left" }}>
              {error}
            </div>
          </div>
        ) : result ? (
          <ResultView result={result} domain={domain} viewMode={viewMode} setViewMode={setViewMode} onEdgeRemove={onEdgeRemove} deletedEdges={deletedEdges} />
        ) : (
          <EmptyMicroscope domain={domain} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right Parameters Panel
// ---------------------------------------------------------------------------

function RightPanel({
  domain, params, setParams, isOpen, setIsOpen,
  history,
}: {
  domain: Domain;
  params: Record<string, number>;
  setParams: (p: Record<string, number>) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  history: { id: string; type: "genesis" | "cut"; detail: string }[];
}) {
  const sliders = [
    { key: "max_filtration_radius", label: "Max Filtration Radius", min: 0.1, max: 5, step: 0.1, description: "Controls the Cech/Vietoris-Rips complex scale" },
    { key: "gnn_layers", label: "GNN Layers", min: 1, max: 10, step: 1, description: "Depth of the graph neural network" },
    { key: "persistence_threshold", label: "Persistence Threshold", min: 0, max: 1, step: 0.01, description: "Minimum lifetime for topological features" },
    { key: "homology_degree", label: "Homology Degree", min: 0, max: 3, step: 1, description: "Maximum Betti number dimension to compute" },
  ];
  const defaultVal = (key: string) => key === "max_filtration_radius" ? 1.5 : key === "gnn_layers" ? 3 : key === "persistence_threshold" ? 0.1 : 1;

  return (
    <div style={{ width: isOpen ? 280 : 44, minWidth: isOpen ? 280 : 44, flexShrink: 0, background: "#1C1F21", borderLeft: "1px solid #2C3133", transition: "width 0.25s ease, min-width 0.25s ease", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <button id="params-toggle-btn" onClick={() => setIsOpen(!isOpen)} title={isOpen ? "Collapse" : "Expand advanced parameters"}
        style={{ background: "transparent", border: "none", borderBottom: "1px solid #2C3133", color: "#888C8E", cursor: "pointer", padding: "14px", display: "flex", alignItems: "center", justifyContent: isOpen ? "space-between" : "center", gap: 8, transition: "color 0.15s", whiteSpace: "nowrap", overflow: "hidden", minHeight: 48 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E6E4DF"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#888C8E"; }}
      >
        {isOpen && <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#888C8E", textTransform: "uppercase" }}>Advanced Parameters</span>}
        <span style={{ fontSize: 16, transform: isOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s" }}>⟩</span>
      </button>

      {isOpen && (
        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>

          {/* ── Perturbation Ledger ──────────────────────────────────────── */}
          {history.length > 0 && (
            <div>
              <div style={{ color: "#888C8E", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                ⊕ Perturbation Ledger
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {history.map((entry, i) => {
                  const isGenesis = entry.type === "genesis";
                  const color = isGenesis ? "#6B8075" : "#C05640";
                  const isLast = i === history.length - 1;
                  return (
                    <div key={entry.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: color, flexShrink: 0,
                          boxShadow: `0 0 6px ${color}88`,
                          marginTop: 2,
                        }} />
                        {!isLast && (
                          <div style={{ width: 1, flex: 1, background: "#2C3133", minHeight: 18, marginTop: 2 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: isLast ? 0 : 14 }}>
                        <div style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", lineHeight: 1 }}>
                          {isGenesis ? "GENESIS" : "CUT"}
                        </div>
                        <div style={{ color: "#888C8E", fontSize: 9, marginTop: 3, lineHeight: 1.5, fontFamily: "'Courier New', monospace" }}>
                          {entry.detail}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Advanced parameter sliders ────────────────────────────────── */}
          <div>
            <div style={{ color: "#888C8E", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              ⊙ Advanced Parameters
            </div>
            {sliders.map((s) => (
              <div key={s.key} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#E6E4DF", fontSize: 11, fontWeight: 500 }}>{s.label}</span>
                  <span style={{ color: domain.color, fontSize: 11, fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{params[s.key] ?? defaultVal(s.key)}</span>
                </div>
                <input id={`param-${s.key}`} type="range" min={s.min} max={s.max} step={s.step} value={params[s.key] ?? defaultVal(s.key)}
                  onChange={(e) => setParams({ ...params, [s.key]: parseFloat(e.target.value) })}
                  style={{ width: "100%", accentColor: domain.color, cursor: "pointer" }}
                />
                <div style={{ color: "#888C8E", fontSize: 9, marginTop: 4, lineHeight: 1.5 }}>{s.description}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "12px", background: "#141617", borderRadius: 8, border: "1px solid #2C3133" }}>
            <div style={{ color: "#888C8E", fontSize: 9, lineHeight: 1.7 }}>
              <span style={{ color: domain.color, fontWeight: 600 }}>Professor mode</span><br />
              These parameters will tune the persistent homology pipeline and GNN architecture in Step 3.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [selectedDomain, setSelectedDomain] = useState<Domain>(DOMAINS[1]);
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [pastedText, setPastedText] = useState("");
  const [formulaText, setFormulaText] = useState("K_5");
  const [fileContent, setFileContent] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MathResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paramsOpen, setParamsOpen] = useState(false);
  const [params, setParams] = useState<Record<string, number>>({
    max_filtration_radius: 1.5, gnn_layers: 3,
    persistence_threshold: 0.1, homology_degree: 1,
  });
  const [viewMode, setViewMode] = useState<"spectral" | "saliency">("spectral");
  // currentEdges tracks the live edge list after any user perturbations.
  const [currentEdges, setCurrentEdges] = useState<(string | number)[][]>([]);
  const [perturbationCount, setPerturbationCount] = useState(0);
  // deletedEdges: kept in 3D as ghost strands, removed from maths.
  const [deletedEdges, setDeletedEdges] = useState<(string | number)[][]>([]);
  // history: the Laboratory Ledger timeline.
  const [history, setHistory] = useState<{ id: string; type: "genesis" | "cut"; detail: string }[]>([]);

  useEffect(() => { setResult(null); setError(null); }, [selectedDomain]);

  const handleFileLoad = useCallback((raw: string) => {
    setFileContent(raw);
    setInputMode("upload");
  }, []);

  const handleDiscover = useCallback(async () => {
    setIsLoading(true); setError(null); setResult(null);
    try {
      let inputType: InputType;
      let rawData: string;
      if (inputMode === "upload") {
        if (!fileContent.trim()) throw new Error("No file loaded. Drop or select a JSON file first.");
        inputType = "json"; rawData = fileContent;
      } else if (inputMode === "paste") {
        if (!pastedText.trim()) {
          inputType = selectedDomain.defaultInputType; rawData = selectedDomain.defaultRawData;
        } else { inputType = "edge_list"; rawData = pastedText; }
      } else {
        const trimmed = formulaText.trim();
        if (!trimmed) throw new Error("Formula is empty. Enter a formula such as K_5, C_6, or P_4.");
        inputType = "formula"; rawData = trimmed;
      }
      const response = await processObject(inputType, rawData);
      setResult(response);
      setCurrentEdges(response.edges);
      setDeletedEdges([]);
      setPerturbationCount(0);
      setHistory([{ id: "genesis", type: "genesis", detail: `Origin: ${rawData.slice(0, 40).replace(/\n/g, " · ")}` }]);
    } catch (err) {
      // Extract the most human-readable message from any error shape:
      //   ApiError  → err.detail (set by apiFetch, includes HTTP context)
      //   Error     → err.message (standard JS Error)
      //   unknown   → String(err) as last resort
      let msg: string;
      if (err instanceof ApiError) {
        msg = err.detail;
      } else if (err instanceof Error) {
        msg = err.message;
      } else {
        msg = String(err);
      }
      setError(msg);
    } finally { setIsLoading(false); }
  }, [selectedDomain, inputMode, pastedText, formulaText, fileContent]);

  /**
   * handleEdgeRemove — called by GraphVisualizer when the user clicks an edge.
   * Filters out the clicked edge from currentEdges, serialises the remainder
   * as an edge_list string, and silently re-submits to the backend for a full
   * topology + AI saliency recalculation.
   */
  const handleEdgeRemove = useCallback(
    async (source: string | number, target: string | number) => {
      const src = String(source);
      const tgt = String(target);

      // Filter the clicked edge out of the active edge list (undirected).
      const nextEdges = currentEdges.filter(([u, v]) => {
        const us = String(u);
        const vs = String(v);
        return !((us === src && vs === tgt) || (us === tgt && vs === src));
      });

      if (nextEdges.length === 0) return; // refuse empty graph

      // Record the deleted edge as a ghost and in the ledger.
      setDeletedEdges((prev) => [...prev, [src, tgt]]);
      setCurrentEdges(nextEdges);
      setPerturbationCount((c) => c + 1);
      setHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), type: "cut", detail: `Cut (${src}, ${tgt})` },
      ]);

      // Serialise remaining edges as a plain edge_list string.
      const rawData = nextEdges.map(([u, v]) => `${u} ${v}`).join("\n");

      setIsLoading(true);
      setError(null);
      try {
        const response = await processObject("edge_list", rawData);
        setResult(response);
        setCurrentEdges(response.edges);
      } catch (err) {
        let msg: string;
        if (err instanceof ApiError) msg = err.detail;
        else if (err instanceof Error) msg = err.message;
        else msg = String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [currentEdges]
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #141617; color: #E6E4DF; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #141617; }
        ::-webkit-scrollbar-thumb { background: #2C3133; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #888C8E; }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.25; } 50% { transform: scale(1.08); opacity: 0.55; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{ background: "#1C1F21", borderBottom: "1px solid #2C3133", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#E6E4DF", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em" }}>Visual Mathematical Discovery Engine</span>
            <span style={{ background: "#2C3133", color: "#888C8E", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>Step 2 · Data Ingestion</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ color: "#888C8E", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6B8075", display: "inline-block" }} />
              Backend · localhost:8000
            </span>
            <span style={{ color: "#888C8E", fontSize: 11 }}>
              Domain: <span style={{ color: selectedDomain.color, fontWeight: 600 }}>{selectedDomain.label}</span>
            </span>
          </div>
        </header>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <Sidebar selected={selectedDomain} onSelect={setSelectedDomain} />

          {/* Central scrollable column */}
          <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: selectedDomain.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {selectedDomain.icon} {selectedDomain.label}
              </span>
              <span style={{ color: "#2C3133", fontSize: 12 }}>·</span>
              <span style={{ color: "#888C8E", fontSize: 11 }}>{selectedDomain.subtitle}</span>
            </div>

            {/* Dropzone card */}
            <section style={{ flexShrink: 0, background: "#1C1F21", border: "1px solid #2C3133", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16, minHeight: 280 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#888C8E", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>⬆ Input / Data Source</span>
                <span style={{ color: "#888C8E", fontSize: 10 }}>All parsing is performed server-side</span>
              </div>
              <Dropzone
                domain={selectedDomain}
                inputMode={inputMode} setInputMode={setInputMode}
                pastedText={pastedText} setPastedText={setPastedText}
                formulaText={formulaText} setFormulaText={setFormulaText}
                onFileLoad={handleFileLoad}
                isDragging={isDragging} setIsDragging={setIsDragging}
              />
            </section>

            {/* Discover Structure button */}
            <button
              id="discover-btn"
              onClick={handleDiscover}
              disabled={isLoading}
              style={{
                background: isLoading ? "#2C3133" : `linear-gradient(135deg, ${selectedDomain.color}, ${selectedDomain.color}cc)`,
                border: "none", borderRadius: 10,
                color: isLoading ? "#888C8E" : "#E6E4DF",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 600, letterSpacing: "0.06em",
                padding: "16px 24px", transition: "all 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, textTransform: "uppercase", flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              {isLoading ? (
                <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Computing Invariants…</>
              ) : (
                <><span>⚗</span> Discover Structure</>
              )}
            </button>

            {/* Structure Microscope */}
            <section style={{ flexShrink: 0, minHeight: 400 }}>
              <Microscope result={result} domain={selectedDomain} error={error} viewMode={viewMode} setViewMode={setViewMode} onEdgeRemove={handleEdgeRemove} perturbationCount={perturbationCount} deletedEdges={deletedEdges} />
            </section>
          </main>

          {/* Right panel */}
          <RightPanel domain={selectedDomain} params={params} setParams={setParams} isOpen={paramsOpen} setIsOpen={setParamsOpen} history={history} />
        </div>
      </div>
    </>
  );
}
