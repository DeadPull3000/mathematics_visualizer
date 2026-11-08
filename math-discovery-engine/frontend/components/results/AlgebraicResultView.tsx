"use client";

import { ProfessorNotes } from "@/components/ProfessorNotes";
import { TropicalInspector } from "@/components/TropicalInspector";

import React from "react";
import { Domain } from "@/types/domain";
import { AlgebraicResponse } from "@/lib/api";
import GraphVisualizer, { ViewMode } from "@/components/GraphVisualizer";

export interface AlgebraicResultViewProps {
  algebraicResult: AlgebraicResponse;
  domain: Domain;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}

export function AlgebraicResultView({
  algebraicResult,
  domain,
  viewMode,
  setViewMode,
}: AlgebraicResultViewProps) {
  const inv = algebraicResult.invariants;
  const jacobian = algebraicResult.jacobian;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Vertices", value: inv.num_vertices, color: domain.color },
          { label: "Faces", value: inv.num_faces, color: "#6B8075" },
          { label: "Edges", value: algebraicResult.edges.length, color: "#888C8E" },
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
              {s.value.toLocaleString()}
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
            {[
              {
                name: "Vertices |V|",
                value: inv.num_vertices.toLocaleString(),
                color: domain.color,
                desc: "Isosurface vertices extracted by Marching Cubes",
              },
              {
                name: "Faces |F|",
                value: inv.num_faces.toLocaleString(),
                color: "#6B8075",
                desc: "Triangular faces of the zero-level set",
              },
              {
                name: "Edges |E|",
                value: algebraicResult.edges.length.toLocaleString(),
                color: "#888C8E",
                desc: "Wireframe edges (3 per face, deduplicated)",
              },
            ].map((row, i, arr) => (
              <tr
                key={row.name}
                style={{
                  borderBottom: i < arr.length - 1 ? "1px solid #2C3133" : "none",
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
                    }}
                  >
                    {row.value}
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

      {/* 3D Wireframe Visualizer */}
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
            Algebraic Variety · Marching Cubes Isosurface (WebGL)
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
                spectral: "⟡ Wireframe Variety",
                saliency: "◈ Highlight Singularities",
              };
              return (
                <button
                  key={mode}
                  id={`algebraic-view-toggle-${mode}`}
                  onClick={() => setViewMode(mode)}
                  style={{
                    background: isActive
                      ? mode === "saliency"
                        ? "#C05640"
                        : domain.color
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
        <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          {(viewMode === "spectral"
            ? [
                { color: domain.color, label: "Surface vertex" },
                { color: "#2C3133", label: "Wireframe edge", border: `1px solid ${domain.color}60` },
              ]
            : [
                { color: "#C05640", label: "Singular point (‖∇F‖ ≈ 0)" },
                { color: "#888C8E", label: "Regular point" },
              ]
          ).map(
            ({
              color,
              label,
              border,
            }: {
              color: string;
              label: string;
              border?: string;
            }) => (
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
                    border,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {label}
              </span>
            )
          )}
        </div>
        <GraphVisualizer
          nodes={algebraicResult.nodes.map((n) => n.id)}
          edges={algebraicResult.edges.map((e) => e as (string | number)[])}
          knotNodes={algebraicResult.nodes.map((n) => ({
            id: n.id,
            fx: n.fx,
            fy: n.fy,
            fz: n.fz,
          }))}
          faces={algebraicResult.faces as [number | string, number | string, number | string][]}
          saliencyScores={Object.fromEntries(
            Object.entries(algebraicResult.saliency_scores).map(([k, v]) => [k, v])
          )}
          viewMode={viewMode}
          height={420}
        />
      </div>

      {/* ── Exact Algebraic Analysis ── symbolic Jacobian + exact singularities */}
      {(jacobian || algebraicResult.exact_singularities) && (
        <div
          style={{
            border: "1px solid #2C3133",
            borderRadius: 10,
            background: "#0D1012",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid #2C3133",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: domain.color, fontSize: 12 }}>∿</span>
            <span
              style={{
                color: "#E6E4DF",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Exact Algebraic Analysis{" "}
              <span style={{ color: "#555A5D", fontWeight: 400, textTransform: "none" }}>
                (Symbolic)
              </span>
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "linear-gradient(to right, #2C3133, transparent)",
              }}
            />
            <span style={{ color: "#3A3F42", fontSize: 9, letterSpacing: "0.08em" }}>
              SymPy · Gröbner Basis
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {/* ── LEFT: Jacobian ── */}
            <div style={{ padding: "18px 20px", borderRight: "1px solid #2C3133" }}>
              <div
                style={{
                  color: "#888C8E",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                The Jacobian (∇F)
              </div>
              {jacobian && jacobian.length === 3 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(["x", "y", "z"] as const).map((axis, i) => (
                    <div key={axis} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          color: "#555A5D",
                          fontFamily: "'Georgia', serif",
                          fontSize: 12,
                          flexShrink: 0,
                          width: 60,
                        }}
                      >
                        ∂F/∂{axis} =
                      </span>
                      <code
                        style={{
                          color: "#E6E4DF",
                          fontFamily: "'Courier New', monospace",
                          fontSize: 13,
                          fontWeight: 600,
                          background: "#1A1D1F",
                          border: "1px solid #2C3133",
                          borderRadius: 6,
                          padding: "5px 10px",
                          wordBreak: "break-all",
                          lineHeight: 1.4,
                        }}
                      >
                        {jacobian[i]}
                      </code>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: "#3A3F42", fontSize: 11, fontStyle: "italic" }}>
                  Not available
                </span>
              )}
            </div>

            {/* ── RIGHT: Exact Singularities ── */}
            <div style={{ padding: "18px 20px" }}>
              <div
                style={{
                  color: "#888C8E",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Rigorous Singularities{" "}
                <span style={{ color: "#3A3F42", textTransform: "none", letterSpacing: 0 }}>
                  (F = ∇F = 0)
                </span>
              </div>

              {!algebraicResult.exact_singularities ||
              algebraicResult.exact_singularities.length === 0 ? (
                <p
                  style={{
                    color: "#6B8075",
                    fontFamily: "'Georgia', serif",
                    fontSize: 12,
                    lineHeight: 1.7,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Smooth Manifold. The Gröbner basis proves no real singularities exist.
                </p>
              ) : algebraicResult.exact_singularities[0]?.error ? (
                <div
                  style={{
                    color: "#888C8E",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 11,
                    lineHeight: 1.5,
                    background: "#1A1D1F",
                    border: "1px solid #2C3133",
                    borderRadius: 6,
                    padding: "10px 12px",
                  }}
                >
                  ⚠ {algebraicResult.exact_singularities[0].error}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {algebraicResult.exact_singularities.map((sol, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#C0564008",
                        border: "1px solid #C0564044",
                        borderRadius: 7,
                        padding: "9px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          color: "#C0564066",
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "'Courier New', monospace",
                          flexShrink: 0,
                        }}
                      >
                        P{(i + 1).toString().padStart(2, "0")}
                      </span>
                      <code
                        style={{
                          color: "#C05640",
                          fontFamily: "'Courier New', monospace",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        ({["x", "y", "z"].map((v) => sol[v] ?? "?").join(", ")})
                      </code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── BOTTOM ROW: Gröbner Basis & Hessian Determinant ── */}
          <div
            style={{
              borderTop: "1px solid #2C3133",
              padding: "16px 20px",
              background: "#0A0C0E",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            {/* Gröbner Basis */}
            <div>
              <div
                style={{
                  color: "#D19E4A",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Gröbner Basis ⟨F, ∇F⟩ (Lexicographic Order)
              </div>
              {algebraicResult.grobner_basis && algebraicResult.grobner_basis.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {algebraicResult.grobner_basis.map((poly, idx) => (
                    <code
                      key={idx}
                      style={{
                        background: poly === "1" ? "#6B807522" : "#1A1D1F",
                        border: `1px solid ${poly === "1" ? "#6B8075" : "#2C3133"}`,
                        color: poly === "1" ? "#6B8075" : "#E6E4DF",
                        borderRadius: 5,
                        padding: "3px 8px",
                        fontFamily: "'Courier New', monospace",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {poly}
                    </code>
                  ))}
                  {algebraicResult.grobner_basis.includes("1") && (
                    <div style={{ color: "#6B8075", fontSize: 10, marginTop: 4, width: "100%" }}>
                      ✓ 1 ∈ ⟨F, ∇F⟩ — Nullstellensatz certificate of global smoothness.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: "#555A5D", fontSize: 11, fontStyle: "italic" }}>
                  Trivial ideal
                </div>
              )}
            </div>

            {/* Hessian Determinant */}
            <div>
              <div
                style={{
                  color: "#6B8075",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Hessian Determinant det(H(F))
              </div>
              {algebraicResult.hessian_determinant ? (
                <code
                  style={{
                    display: "block",
                    background: "#1A1D1F",
                    border: "1px solid #2C3133",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 11,
                    color: "#E6E4DF",
                    wordBreak: "break-all",
                  }}
                >
                  {algebraicResult.hessian_determinant}
                </code>
              ) : (
                <div style={{ color: "#555A5D", fontSize: 11, fontStyle: "italic" }}>
                  Not computed
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tropical Geometry & Newton Polygons */}
      <TropicalInspector initialFormula={algebraicResult.formula ?? "y**2 - x**3 - x - 1"} />

      {/* Professor's Notes */}
      <ProfessorNotes domain="algebraic" invariants={algebraicResult as unknown as Record<string, unknown>} />
    </div>
  );
}
