"use client";

import React from "react";
import { Domain } from "@/types/domain";
import { KnotResponse } from "@/lib/api";
import GraphVisualizer, { ViewMode } from "@/components/GraphVisualizer";

export interface KnotResultViewProps {
  knotResult: KnotResponse;
  domain: Domain;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}

export function KnotResultView({
  knotResult,
  domain,
  viewMode,
  setViewMode,
}: KnotResultViewProps) {
  const inv = knotResult.invariants;
  const rows = [
    { name: "Knot Type", value: inv.type, color: domain.color, desc: "Family of knot / link" },
    { name: "Parameters (p,q)", value: `(${inv.p}, ${inv.q})`, color: "#D19E4A", desc: "Torus knot winding numbers" },
    { name: "Crossing Number", value: inv.crossing_number, color: "#C05640", desc: "Minimum crossings over all diagrams" },
    { name: "Strand Count", value: knotResult.nodes.length, color: "#6B8075", desc: "Parametric sample points" },
    {
      name: "Writhe (Gauss)",
      value: inv.writhe != null ? inv.writhe.toFixed(4) : "—",
      color: "#D19E4A",
      desc: "Discrete Gauss linking integral",
    },
  ];

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "p", value: inv.p, color: "#D19E4A" },
          { label: "q", value: inv.q, color: "#6B8075" },
          { label: "Crossings c", value: inv.crossing_number, color: "#C05640" },
          { label: "Writhe", value: inv.writhe != null ? inv.writhe.toFixed(2) : "—", color: "#D19E4A" },
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

      {/* 3D Knot Visualizer */}
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
            Torus Knot · 3D Parametric Curve (WebGL)
          </div>
          {/* View Mode Toggle */}
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
                spectral: "⟡ Parametric Base",
                saliency: "◈ Gradient Saliency",
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
        <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
          <span
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
                width: 18,
                height: 3,
                background: "#C05640",
                display: "inline-block",
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            Knot strand
          </span>
          {viewMode === "spectral" ? (
            <span
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
                  background: "#6B8075",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              Sample point
            </span>
          ) : (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {[
                { color: "#C05640", label: "High Entanglement (> 0.6)" },
                { color: "#D19E4A", label: "Medium (0.3–0.6)" },
                { color: "#1C1F21", label: "Low (< 0.3)", border: "1px solid #2C3133" },
              ].map(({ color, label, border }) => (
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
                      border,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
        <GraphVisualizer
          nodes={[]}
          edges={knotResult.edges.map((e) => e as (string | number)[])}
          knotNodes={knotResult.nodes}
          saliencyScores={knotResult.saliency_scores ?? {}}
          viewMode={viewMode}
          height={400}
        />
      </div>
    </div>
  );
}
