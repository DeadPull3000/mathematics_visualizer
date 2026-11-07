"use client";

import React from "react";
import { Domain } from "@/types/domain";
import { ManifoldResponse } from "@/lib/api";
import GraphVisualizer, { ViewMode } from "@/components/GraphVisualizer";

export interface ManifoldResultViewProps {
  manifoldResult: ManifoldResponse;
  domain: Domain;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  onNodeRemove?: (nodeId: string | number) => void;
}

export function ManifoldResultView({
  manifoldResult,
  domain: _domain,
  viewMode,
  setViewMode,
  onNodeRemove,
}: ManifoldResultViewProps) {
  const inv = manifoldResult.invariants;
  const rows = [
    { name: "Vertices V", value: inv.vertices, color: "#D19E4A", desc: "Mesh vertex count" },
    { name: "Edges E", value: inv.edges, color: "#C05640", desc: "Mesh edge count" },
    {
      name: "Euler Characteristic",
      value: inv.euler_characteristic,
      color: inv.euler_characteristic === 2 ? "#6B8075" : "#D19E4A",
      desc: "χ = V − E + F  (Sphere: 2, Torus: 0)",
    },
  ];

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "V", value: inv.vertices, color: "#D19E4A" },
          { label: "E", value: inv.edges, color: "#C05640" },
          {
            label: "χ",
            value: inv.euler_characteristic,
            color: inv.euler_characteristic === 2 ? "#6B8075" : "#D19E4A",
          },
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

      {/* 3D Manifold Visualizer */}
      <div
        style={{
          border: "1px solid #2C3133",
          borderRadius: 10,
          background: "#0F1113",
          padding: "14px 14px 10px",
        }}
      >
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
            Manifold Mesh · Laplacian Harmonics (WebGL)
          </div>
          {/* View mode toggle */}
          <div
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
                spectral: "⟡ Base Geometry",
                saliency: "◈ Spectral Harmonics",
              };
              return (
                <button
                  key={mode}
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
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 14, marginBottom: 8, flexWrap: "wrap" }}>
          {(viewMode === "saliency"
            ? [
                { color: "#C05640", label: "+ amplitude" },
                { color: "#D19E4A", label: "≈ nodal line" },
                { color: "#6B8075", label: "− amplitude" },
              ]
            : [{ color: "#6B8075", label: "Mesh vertices" }]
          ).map(({ color, label }) => (
            <span
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 9,
                color: "#888C8E",
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
        <GraphVisualizer
          nodes={[]}
          edges={manifoldResult.edges.map((e) => e as (string | number)[])}
          knotNodes={manifoldResult.nodes}
          faces={manifoldResult.faces}
          harmonics={manifoldResult.harmonics}
          viewMode={viewMode}
          height={440}
          onNodeRemove={onNodeRemove}
        />
      </div>
    </div>
  );
}
