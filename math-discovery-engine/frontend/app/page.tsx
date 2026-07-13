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
  ApiError,
} from "@/lib/api";

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

function ResultView({ result, domain }: { result: MathResponse; domain: Domain }) {
  const m = result.metadata;
  const densityColor = m.density > 0.7 ? "#C05640" : m.density > 0.3 ? "#D19E4A" : "#6B8075";
  const densityPct = (m.density * 100).toFixed(1);
  const planarLabel = m.is_planar === null ? "Skipped (|E| > 1 000)" : m.is_planar ? "Yes ✓" : "No ✗";
  const planarColor = m.is_planar === null ? "#888C8E" : m.is_planar ? "#6B8075" : "#C05640";

  const rows = [
    { name: "Vertices |V|", value: m.num_nodes, color: "#D19E4A", desc: "Cardinality of the vertex set" },
    { name: "Edges |E|", value: m.num_edges, color: "#C05640", desc: "Cardinality of the edge set" },
    { name: "Connected", value: m.is_connected ? "Yes ✓" : "No ✗", color: m.is_connected ? "#6B8075" : "#C05640", desc: "All vertices reachable from each other" },
    { name: "β₀ Components", value: m.num_connected_components, color: m.num_connected_components === 1 ? "#6B8075" : "#D19E4A", desc: "0th Betti number — path-connected components" },
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

      {/* 1-skeleton circular preview */}
      <div style={{ border: "1px solid #2C3133", borderRadius: 10, background: "#0F1113", padding: "14px 14px 10px" }}>
        <div style={{ color: "#888C8E", fontSize: 9, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
          1-Skeleton Preview (force-directed 3D rendering · Step 3)
        </div>
        <div style={{ position: "relative", height: 80, overflow: "hidden" }}>
          {result.edges.slice(0, 60).map((edge, idx) => {
            const total = Math.min(result.nodes.length, 40);
            const uIdx = result.nodes.findIndex((n) => n === edge[0]);
            const vIdx = result.nodes.findIndex((n) => n === edge[1]);
            if (uIdx < 0 || vIdx < 0 || uIdx >= 40 || vIdx >= 40) return null;
            const rx = 44, ry = 38;
            const aU = (uIdx / total) * 2 * Math.PI;
            const aV = (vIdx / total) * 2 * Math.PI;
            const x1 = 50 + rx * Math.cos(aU), y1 = 50 + ry * Math.sin(aU);
            const x2 = 50 + rx * Math.cos(aV), y2 = 50 + ry * Math.sin(aV);
            return (
              <svg key={idx} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke={domain.color} strokeWidth={0.6} opacity={0.3} />
              </svg>
            );
          })}
          {result.nodes.slice(0, 40).map((node, idx) => {
            const total = Math.min(result.nodes.length, 40);
            const angle = (idx / total) * 2 * Math.PI;
            const rx = 44, ry = 38;
            const cx = 50 + rx * Math.cos(angle), cy = 50 + ry * Math.sin(angle);
            return (
              <div key={String(node)} title={`Node ${node}`}
                style={{ position: "absolute", width: 6, height: 6, borderRadius: "50%", background: domain.color, opacity: 0.75, left: `${cx}%`, top: `${cy}%`, transform: "translate(-50%, -50%)", transition: "all 0.4s ease" }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Microscope wrapper
// ---------------------------------------------------------------------------

function Microscope({ result, domain, error }: { result: MathResponse | null; domain: Domain; error: string | null }) {
  return (
    <div style={{ background: "#111315", border: "1px solid #2C3133", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 400 }}>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid #2C3133", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: domain.color, fontSize: 14 }}>◉</span>
          <span style={{ color: "#E6E4DF", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>STRUCTURE MICROSCOPE</span>
        </div>
        {result && (
          <span style={{ background: "#6B807520", border: "1px solid #6B8075", color: "#6B8075", borderRadius: 6, padding: "2px 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>
            {result.metadata.num_nodes}V · {result.metadata.num_edges}E
          </span>
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
          <ResultView result={result} domain={domain} />
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

function RightPanel({ domain, params, setParams, isOpen, setIsOpen }: {
  domain: Domain; params: Record<string, number>;
  setParams: (p: Record<string, number>) => void;
  isOpen: boolean; setIsOpen: (v: boolean) => void;
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
          {sliders.map((s) => (
            <div key={s.key}>
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
          <div style={{ marginTop: 8, padding: "12px", background: "#141617", borderRadius: 8, border: "1px solid #2C3133" }}>
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
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally { setIsLoading(false); }
  }, [selectedDomain, inputMode, pastedText, formulaText, fileContent]);

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
            <section style={{ background: "#1C1F21", border: "1px solid #2C3133", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16, minHeight: 280 }}>
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
            <section style={{ minHeight: 400 }}>
              <Microscope result={result} domain={selectedDomain} error={error} />
            </section>
          </main>

          {/* Right panel */}
          <RightPanel domain={selectedDomain} params={params} setParams={setParams} isOpen={paramsOpen} setIsOpen={setParamsOpen} />
        </div>
      </div>
    </>
  );
}
