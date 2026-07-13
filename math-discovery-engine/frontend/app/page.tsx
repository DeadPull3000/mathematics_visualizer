"use client";

/**
 * frontend/app/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Main page of the Visual Mathematical Discovery Engine.
 *
 * Layout:
 *   [ Left Sidebar ] | [ Dropzone / Microscope ] | [ Right Parameters Panel ]
 *
 * Color palette: "Chalk, Slate, and Terracotta"
 *   Primary BG  : #141617  (Obsidian Slate)
 *   Card BG     : #1C1F21  (Chalkboard Grey)
 *   Primary Text: #E6E4DF  (Warm Alabaster)
 *   Muted Text  : #888C8E  (Faded Lead)
 *   Borders     : #2C3133  (Slate Joint)
 *   Accent 1    : #C05640  (Terracotta)
 *   Accent 2    : #D19E4A  (Aged Ochre)
 *   Accent 3    : #6B8075  (Faded Sage)
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  processObject,
  type ObjectType,
  type ProcessObjectResponse,
  ApiError,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Domain = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  apiType: ObjectType;
  color: string;
  exampleData: Record<string, unknown>;
};

type InputMode = "upload" | "paste" | "formula";

// ─── Domain definitions ───────────────────────────────────────────────────────

const DOMAINS: Domain[] = [
  {
    id: "topology",
    label: "Topology",
    subtitle: "Surfaces & Manifolds",
    icon: "◎",
    apiType: "graph",
    color: "#6B8075",
    exampleData: {
      nodes: [0, 1, 2, 3, 4, 5, 6, 7],
      edges: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],
    },
  },
  {
    id: "combinatorics",
    label: "Combinatorics",
    subtitle: "Graphs & Networks",
    icon: "⬡",
    apiType: "graph",
    color: "#D19E4A",
    exampleData: {
      nodes: [0,1,2,3,4],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,2]],
    },
  },
  {
    id: "knot",
    label: "Knot Theory",
    subtitle: "Links & Tangles",
    icon: "∞",
    apiType: "knot",
    color: "#C05640",
    exampleData: { crossings: [1, -1, 1, -1, 1, -1] },
  },
  {
    id: "circuit",
    label: "Complexity Theory",
    subtitle: "Boolean Circuits",
    icon: "⊕",
    apiType: "circuit",
    color: "#6B8075",
    exampleData: { gates: ["INPUT", "AND", "OR", "NOT", "XOR", "OUTPUT"] },
  },
  {
    id: "algebraic-geometry",
    label: "Algebraic Geometry",
    subtitle: "Varieties & Schemes",
    icon: "∿",
    apiType: "graph",
    color: "#D19E4A",
    exampleData: { nodes: [0,1,2,3,4,5,6,7,8,9], edges: [[0,1],[1,2],[2,0],[3,4],[4,5],[5,3],[6,7],[7,8],[8,9],[9,6],[0,3],[1,6],[2,9]] },
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

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
        width: 220,
        minWidth: 220,
        background: "#1C1F21",
        borderRight: "1px solid #2C3133",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        gap: 0,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>𝕄</span>
          <span
            style={{
              color: "#E6E4DF",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.02em",
              fontFamily: "'Georgia', serif",
            }}
          >
            Discovery Engine
          </span>
        </div>
        <span style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.08em" }}>
          VISUAL MATH · v0.1
        </span>
      </div>

      {/* Section label */}
      <div
        style={{
          padding: "0 20px 12px",
          color: "#888C8E",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Mathematical Domain
      </div>

      {/* Domain list */}
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
              cursor: "pointer",
              padding: "12px 20px",
              textAlign: "left",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = "#1e2124";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
          >
            <span
              style={{
                fontSize: 18,
                width: 26,
                textAlign: "center",
                color: isActive ? d.color : "#888C8E",
                transition: "color 0.15s",
              }}
            >
              {d.icon}
            </span>
            <div>
              <div
                style={{
                  color: isActive ? "#E6E4DF" : "#888C8E",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  transition: "color 0.15s",
                  letterSpacing: "0.01em",
                }}
              >
                {d.label}
              </div>
              <div style={{ color: "#888C8E", fontSize: 10, marginTop: 1, letterSpacing: "0.02em" }}>
                {d.subtitle}
              </div>
            </div>
          </button>
        );
      })}

      {/* Footer */}
      <div style={{ marginTop: "auto", padding: "20px 20px 0", borderTop: "1px solid #2C3133" }}>
        <div style={{ color: "#888C8E", fontSize: 10, lineHeight: 1.6 }}>
          Drag a structure into the dropzone or paste an edge list to begin.
        </div>
      </div>
    </aside>
  );
}

function Dropzone({
  domain,
  inputMode,
  setInputMode,
  pastedText,
  setPastedText,
  onFileLoad,
  isDragging,
  setIsDragging,
}: {
  domain: Domain;
  inputMode: InputMode;
  setInputMode: (m: InputMode) => void;
  pastedText: string;
  setPastedText: (v: string) => void;
  onFileLoad: (content: string) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        onFileLoad(text);
      };
      reader.readAsText(file);
    },
    [onFileLoad, setIsDragging]
  );

  const modes: { id: InputMode; label: string }[] = [
    { id: "upload", label: "Upload JSON" },
    { id: "paste", label: "Edge List" },
    { id: "formula", label: "Formula" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2C3133" }}>
        {modes.map((m) => (
          <button
            key={m.id}
            id={`tab-${m.id}`}
            onClick={() => setInputMode(m.id)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: inputMode === m.id ? `2px solid ${domain.color}` : "2px solid transparent",
              color: inputMode === m.id ? "#E6E4DF" : "#888C8E",
              cursor: "pointer",
              padding: "10px 18px",
              fontSize: 12,
              fontWeight: inputMode === m.id ? 600 : 400,
              letterSpacing: "0.04em",
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Upload dropzone */}
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
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            gap: 12,
            transition: "all 0.2s ease",
            background: isDragging ? `${domain.color}08` : "transparent",
          }}
        >
          <div
            style={{
              fontSize: 36,
              opacity: isDragging ? 1 : 0.5,
              transition: "opacity 0.2s",
            }}
          >
            {domain.icon}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#E6E4DF", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Drop your JSON file here
            </div>
            <div style={{ color: "#888C8E", fontSize: 12 }}>
              or click to browse · accepts{" "}
              <code
                style={{
                  background: "#2C3133",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 11,
                  color: domain.color,
                }}
              >
                .json
              </code>{" "}
              files
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            id="file-input"
            accept=".json"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => onFileLoad(ev.target?.result as string);
              reader.readAsText(file);
            }}
          />
        </div>
      )}

      {/* Paste edge list */}
      {inputMode === "paste" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
            Paste an edge list — one edge per line, space-separated. e.g.{" "}
            <code style={{ color: domain.color, fontSize: 11 }}>0 1</code>
          </div>
          <textarea
            id="edge-list-input"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={"0 1\n1 2\n2 3\n3 0\n0 2\n1 3"}
            style={{
              minHeight: 200,
              background: "#111315",
              border: "1px solid #2C3133",
              borderRadius: 10,
              color: "#E6E4DF",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 13,
              lineHeight: 1.7,
              padding: "14px 16px",
              resize: "vertical",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.target.style.borderColor = domain.color; }}
            onBlur={(e) => { e.target.style.borderColor = "#2C3133"; }}
          />
        </div>
      )}

      {/* Formula input */}
      {inputMode === "formula" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
            Enter a mathematical expression or knot notation
          </div>
          <input
            id="formula-input"
            type="text"
            placeholder="e.g.  K(3,2)  or  C_5 □ K_2  or  3_1#4_1"
            style={{
              background: "#111315",
              border: "1px solid #2C3133",
              borderRadius: 10,
              color: "#E6E4DF",
              fontFamily: "'Georgia', serif",
              fontSize: 16,
              padding: "16px 18px",
              outline: "none",
              transition: "border-color 0.15s",
              letterSpacing: "0.04em",
            }}
            onFocus={(e) => { e.target.style.borderColor = domain.color; }}
            onBlur={(e) => { e.target.style.borderColor = "#2C3133"; }}
          />
          <div
            style={{
              background: "#111315",
              border: "1px solid #2C3133",
              borderRadius: 10,
              padding: "16px 18px",
              color: "#888C8E",
              fontSize: 12,
              lineHeight: 1.8,
            }}
          >
            <span style={{ color: domain.color, fontWeight: 600 }}>Supported notations:</span>
            <br />
            · Knots: Rolfsen notation{" "}
            <code style={{ color: "#E6E4DF" }}>3_1</code>,{" "}
            <code style={{ color: "#E6E4DF" }}>4_1</code>
            <br />
            · Graph products:{" "}
            <code style={{ color: "#E6E4DF" }}>K_n</code>,{" "}
            <code style={{ color: "#E6E4DF" }}>C_n</code>,{" "}
            <code style={{ color: "#E6E4DF" }}>P_n</code>
            <br />
            · Torus knots:{" "}
            <code style={{ color: "#E6E4DF" }}>T(p,q)</code>
          </div>
        </div>
      )}

    </div>
  );
}

function Microscope({ result, domain, error }: {
  result: ProcessObjectResponse | null;
  domain: Domain;
  error: string | null;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "#111315",
        border: "1px solid #2C3133",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid #2C3133",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: domain.color, fontSize: 14 }}>◉</span>
          <span style={{ color: "#E6E4DF", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>
            STRUCTURE MICROSCOPE
          </span>
        </div>
        {result && (
          <span
            style={{
              background: "#6B807520",
              border: "1px solid #6B8075",
              color: "#6B8075",
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            {result.computation_time_ms.toFixed(1)} ms
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflow: "auto" }}>
        {error ? (
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
            <div style={{ color: "#C05640", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Computation Error
            </div>
            <div style={{ color: "#888C8E", fontSize: 12, lineHeight: 1.7 }}>{error}</div>
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

function EmptyMicroscope({ domain }: { domain: Domain }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 380 }}>
      {/* Animated concentric rings */}
      <div
        style={{
          position: "relative",
          width: 120,
          height: 120,
          margin: "0 auto 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              borderRadius: "50%",
              border: `1px solid ${domain.color}`,
              width: i * 36,
              height: i * 36,
              opacity: 0.15 + i * 0.1,
              animation: `pulse ${1.8 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
        <span style={{ fontSize: 28, color: domain.color, opacity: 0.6, position: "relative", zIndex: 1 }}>
          {domain.icon}
        </span>
      </div>
      <div style={{ color: "#E6E4DF", fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
        Awaiting Mathematical Object
      </div>
      <div style={{ color: "#888C8E", fontSize: 12, lineHeight: 1.7 }}>
        Input a{" "}
        <span style={{ color: domain.color }}>{domain.label.toLowerCase()}</span> structure
        above and click{" "}
        <span style={{ color: domain.color, fontWeight: 600 }}>Discover Structure</span>.
        <br />
        The invariants will render here.
      </div>
      <div
        style={{
          marginTop: 24,
          padding: "10px 16px",
          background: "#1C1F21",
          borderRadius: 8,
          border: "1px solid #2C3133",
          color: "#888C8E",
          fontSize: 11,
          lineHeight: 1.6,
        }}
      >
        🔬 3D force-directed rendering · Persistent homology · Betti numbers
      </div>
    </div>
  );
}

function ResultView({ result, domain }: { result: ProcessObjectResponse; domain: Domain }) {
  const colorForGroup = (group: string) => {
    switch (group) {
      case "core":     return "#C05640";
      case "crossing": return "#D19E4A";
      default:         return "#6B8075";
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary row */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Nodes", value: result.nodes.length, color: "#D19E4A" },
          { label: "Edges", value: result.edges.length, color: "#C05640" },
          { label: "Invariants", value: result.invariants.length, color: "#6B8075" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: "#1C1F21",
              border: "1px solid #2C3133",
              borderRadius: 10,
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ color: s.color, fontSize: 22, fontWeight: 700, fontFamily: "'Georgia', serif" }}>
              {s.value}
            </div>
            <div style={{ color: "#888C8E", fontSize: 10, letterSpacing: "0.08em", marginTop: 2 }}>
              {s.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Invariants table */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #2C3133",
          borderRadius: 10,
          background: "#1C1F21",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2C3133" }}>
              {["Invariant", "Value", "Description"].map((h) => (
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
            {result.invariants.map((inv, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: i < result.invariants.length - 1 ? "1px solid #2C3133" : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "#22262850";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                }}
              >
                <td style={{ padding: "10px 14px", color: "#E6E4DF", fontWeight: 500 }}>
                  {inv.name}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span
                    style={{
                      background: "#2C3133",
                      color: domain.color,
                      borderRadius: 5,
                      padding: "2px 8px",
                      fontFamily: "'Courier New', monospace",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {String(inv.value)}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: "#888C8E", fontSize: 11 }}>
                  {inv.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Node sample visualization */}
      <div
        style={{
          border: "1px solid #2C3133",
          borderRadius: 10,
          background: "#0F1113",
          padding: 14,
          height: 90,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ color: "#888C8E", fontSize: 9, letterSpacing: "0.08em", marginBottom: 8 }}>
          NODE LAYOUT PREVIEW (3D FORTHCOMING)
        </div>
        {result.edges.slice(0, 15).map((e, i) => {
          const src = result.nodes.find((n) => n.id === e.source);
          const tgt = result.nodes.find((n) => n.id === e.target);
          if (!src || !tgt) return null;
          const x1 = ((src.x + 1) / 2) * 90;
          const y1 = ((src.y + 1) / 2) * 70 + 20;
          const x2 = ((tgt.x + 1) / 2) * 90;
          const y2 = ((tgt.y + 1) / 2) * 70 + 20;
          return (
            <svg
              key={i}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            >
              <line
                x1={`${x1}%`} y1={`${y1}%`}
                x2={`${x2}%`} y2={`${y2}%`}
                stroke="#2C3133"
                strokeWidth={0.8}
                opacity={0.6}
              />
            </svg>
          );
        })}
        {result.nodes.slice(0, 20).map((n) => (
          <div
            key={n.id}
            title={`${n.label} (weight: ${n.weight.toFixed(2)})`}
            style={{
              position: "absolute",
              width: 6 + n.weight * 8,
              height: 6 + n.weight * 8,
              borderRadius: "50%",
              background: colorForGroup(n.group),
              opacity: 0.7,
              left: `${((n.x + 1) / 2) * 90}%`,
              top: `${((n.y + 1) / 2) * 70 + 20}%`,
              transform: "translate(-50%, -50%)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RightPanel({
  domain,
  params,
  setParams,
  isOpen,
  setIsOpen,
}: {
  domain: Domain;
  params: Record<string, number>;
  setParams: (p: Record<string, number>) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const sliders = [
    { key: "max_filtration_radius", label: "Max Filtration Radius", min: 0.1, max: 5, step: 0.1, description: "Controls the Čech/Vietoris-Rips complex scale" },
    { key: "gnn_layers", label: "GNN Layers", min: 1, max: 10, step: 1, description: "Depth of the graph neural network" },
    { key: "persistence_threshold", label: "Persistence Threshold", min: 0, max: 1, step: 0.01, description: "Minimum lifetime for topological features" },
    { key: "homology_degree", label: "Homology Degree", min: 0, max: 3, step: 1, description: "Maximum Betti number dimension to compute" },
  ];

  const defaultVal = (key: string) => {
    if (key === "max_filtration_radius") return 1.5;
    if (key === "gnn_layers") return 3;
    if (key === "persistence_threshold") return 0.1;
    return 1;
  };

  return (
    <div
      style={{
        width: isOpen ? 280 : 44,
        minWidth: isOpen ? 280 : 44,
        flexShrink: 0,
        background: "#1C1F21",
        borderLeft: "1px solid #2C3133",
        transition: "width 0.25s ease, min-width 0.25s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Toggle button */}
      <button
        id="params-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Collapse parameters" : "Expand advanced parameters"}
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "1px solid #2C3133",
          color: "#888C8E",
          cursor: "pointer",
          padding: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: isOpen ? "space-between" : "center",
          gap: 8,
          transition: "color 0.15s",
          whiteSpace: "nowrap",
          overflow: "hidden",
          minHeight: 48,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E6E4DF"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#888C8E"; }}
      >
        {isOpen && (
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#888C8E", textTransform: "uppercase" }}>
            Advanced Parameters
          </span>
        )}
        <span style={{ fontSize: 16, transform: isOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s" }}>
          ⟩
        </span>
      </button>

      {/* Sliders */}
      {isOpen && (
        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          {sliders.map((s) => (
            <div key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#E6E4DF", fontSize: 11, fontWeight: 500 }}>{s.label}</span>
                <span
                  style={{
                    color: domain.color,
                    fontSize: 11,
                    fontFamily: "'Courier New', monospace",
                    fontWeight: 700,
                  }}
                >
                  {params[s.key] ?? defaultVal(s.key)}
                </span>
              </div>
              <input
                id={`param-${s.key}`}
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={params[s.key] ?? defaultVal(s.key)}
                onChange={(e) =>
                  setParams({ ...params, [s.key]: parseFloat(e.target.value) })
                }
                style={{ width: "100%", accentColor: domain.color, cursor: "pointer" }}
              />
              <div style={{ color: "#888C8E", fontSize: 9, marginTop: 4, lineHeight: 1.5 }}>
                {s.description}
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: 8,
              padding: "12px",
              background: "#141617",
              borderRadius: 8,
              border: "1px solid #2C3133",
            }}
          >
            <div style={{ color: "#888C8E", fontSize: 9, lineHeight: 1.7 }}>
              <span style={{ color: domain.color, fontWeight: 600 }}>Professor mode</span>
              <br />
              These parameters tune the persistent homology pipeline and the
              GNN architecture used for feature extraction.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [selectedDomain, setSelectedDomain] = useState<Domain>(DOMAINS[1]);
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProcessObjectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paramsOpen, setParamsOpen] = useState(false);
  const [params, setParams] = useState<Record<string, number>>({
    max_filtration_radius: 1.5,
    gnn_layers: 3,
    persistence_threshold: 0.1,
    homology_degree: 1,
  });

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [selectedDomain]);

  const handleFileLoad = useCallback((content: string) => {
    setPastedText(content);
    setInputMode("paste");
  }, []);

  const handleDiscover = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let data: Record<string, unknown> = selectedDomain.exampleData;

      if (inputMode === "paste" && pastedText.trim()) {
        try {
          data = JSON.parse(pastedText);
        } catch {
          const lines = pastedText.trim().split("\n").filter(Boolean);
          const edges = lines.map((l) => l.trim().split(/\s+/).map(Number));
          const nodeSet = new Set(edges.flat());
          data = { nodes: [...nodeSet], edges };
        }
      }

      const response = await processObject(selectedDomain.apiType, data, params);
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.detail} (HTTP ${err.status})`);
      } else {
        setError(String(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedDomain, inputMode, pastedText, params]);

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
        <header
          style={{
            background: "#1C1F21",
            borderBottom: "1px solid #2C3133",
            padding: "0 24px",
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#E6E4DF", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em" }}>
              Visual Mathematical Discovery Engine
            </span>
            <span
              style={{
                background: "#2C3133",
                color: "#888C8E",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.1em",
                padding: "2px 8px",
                borderRadius: 4,
                textTransform: "uppercase",
              }}
            >
              Step 1 · Scaffold
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ color: "#888C8E", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6B8075", display: "inline-block" }} />
              Backend · localhost:8000
            </span>
            <span style={{ color: "#888C8E", fontSize: 11 }}>
              Domain:{" "}
              <span style={{ color: selectedDomain.color, fontWeight: 600 }}>
                {selectedDomain.label}
              </span>
            </span>
          </div>
        </header>

        {/* Body — fills remaining viewport height, never overflows */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <Sidebar selected={selectedDomain} onSelect={setSelectedDomain} />

          {/* ── Central scrollable column ─────────────────────────────── */}
          <main
            style={{
              flex: 1,
              minWidth: 0,
              overflowY: "auto",
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 32,
            }}
          >
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: selectedDomain.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {selectedDomain.icon} {selectedDomain.label}
              </span>
              <span style={{ color: "#2C3133", fontSize: 12 }}>·</span>
              <span style={{ color: "#888C8E", fontSize: 11 }}>{selectedDomain.subtitle}</span>
            </div>

            {/* ── Dropzone card ──────────────────────────────────────── */}
            <section
              style={{
                background: "#1C1F21",
                border: "1px solid #2C3133",
                borderRadius: 12,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minHeight: 280,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#888C8E", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  ⬆ Input / Dropzone
                </span>
                <span style={{ color: "#888C8E", fontSize: 10 }}>
                  Use example data or upload your own
                </span>
              </div>
              <Dropzone
                domain={selectedDomain}
                inputMode={inputMode}
                setInputMode={setInputMode}
                pastedText={pastedText}
                setPastedText={setPastedText}
                onFileLoad={handleFileLoad}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
              />
            </section>

            {/* ── Discover Structure button — standalone, between sections */}
            <button
              id="discover-btn"
              onClick={handleDiscover}
              disabled={isLoading}
              style={{
                background: isLoading
                  ? "#2C3133"
                  : `linear-gradient(135deg, ${selectedDomain.color}, ${selectedDomain.color}cc)`,
                border: "none",
                borderRadius: 10,
                color: isLoading ? "#888C8E" : "#E6E4DF",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.06em",
                padding: "16px 24px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                textTransform: "uppercase",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isLoading)
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                  Computing Invariants…
                </>
              ) : (
                <>
                  <span>⚗</span> Discover Structure
                </>
              )}
            </button>

            {/* ── Microscope output ──────────────────────────────────── */}
            <section style={{ minHeight: 400 }}>
              <Microscope result={result} domain={selectedDomain} error={error} />
            </section>
          </main>

          {/* ── Right parameters panel — fixed width, never crushes center */}
          <RightPanel
            domain={selectedDomain}
            params={params}
            setParams={setParams}
            isOpen={paramsOpen}
            setIsOpen={setParamsOpen}
          />
        </div>
      </div>
    </>
  );
}
