"use client";

import React, { useState, useEffect } from "react";
import { TropicalResponse, analyzeTropicalCurve } from "@/lib/api";

interface TropicalInspectorProps {
  initialFormula?: string;
}

export function TropicalInspector({ initialFormula = "y**2 - x**3 - x - 1" }: TropicalInspectorProps) {
  const [formula, setFormula] = useState(initialFormula);
  const [data, setData] = useState<TropicalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTropical = async (polyFormula: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeTropicalCurve(polyFormula);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Computation failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTropical(initialFormula);
  }, [initialFormula]);

  // SVG grid settings
  const svgSize = 220;
  const padding = 30;
  const maxCoord = Math.max(
    4,
    ...(data?.newton_polygon_vertices.flatMap((p) => p) ?? [4])
  );
  const scale = (svgSize - 2 * padding) / maxCoord;

  const toSvgX = (x: number) => padding + x * scale;
  const toSvgY = (y: number) => svgSize - padding - y * scale;

  return (
    <div
      style={{
        background: "#1C1F21",
        border: "1px solid #2C3133",
        borderRadius: 10,
        padding: "18px 20px",
        marginTop: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🌴</span>
          <div>
            <div
              style={{
                color: "#E6E4DF",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Newton Polygon &Delta;(P) &sub; &Ropf;&sup2;
            </div>
            <div style={{ color: "#888C8E", fontSize: 11 }}>
              Min-Plus Valuation, Dual Subdivision &amp; Pick's Theorem Genus
            </div>
          </div>
        </div>

        {/* Preset curve selector */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { label: "Elliptic (g=1)", expr: "y**2 - x**3 - x - 1" },
            { label: "Fermat (g=1)", expr: "x**3 + y**3 - 1" },
            { label: "Quartic (g=3)", expr: "x**4 + y**4 - 1" },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setFormula(preset.expr);
                fetchTropical(preset.expr);
              }}
              style={{
                background: formula === preset.expr ? "#2C3133" : "transparent",
                color: formula === preset.expr ? "#D19E4A" : "#888C8E",
                border: "1px solid #2C3133",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: 10,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          type="text"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="Polynomial P(x, y) = 0"
          style={{
            flex: 1,
            background: "#141617",
            border: "1px solid #2C3133",
            borderRadius: 6,
            padding: "6px 10px",
            color: "#E6E4DF",
            fontFamily: "'Courier New', monospace",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          onClick={() => fetchTropical(formula)}
          disabled={loading}
          style={{
            background: "#2C3133",
            color: "#D19E4A",
            border: "1px solid #D19E4A50",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Computing..." : "Analyze"}
        </button>
      </div>

      {error && <div style={{ color: "#C05640", fontSize: 11, marginBottom: 10 }}>{error}</div>}

      {data && (
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          {/* Stats on Left */}
          <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Pick's formula card */}
            <div
              style={{
                background: "#141617",
                border: "1px solid #2C3133",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <div style={{ color: "#888C8E", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Pick's / Baker's Genus Formula: g = Area − B/2 + 1
              </div>
              <div style={{ color: "#D19E4A", fontFamily: "'Courier New', monospace", fontSize: 11 }}>
                {data.latex_summary}
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ color: "#888C8E", fontSize: 9, textTransform: "uppercase" }}>Polygon Area</div>
                <div style={{ color: "#E6E4DF", fontSize: 16, fontWeight: 700, fontFamily: "monospace", marginTop: 2 }}>
                  {data.area.toFixed(1)}
                </div>
              </div>
              <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ color: "#888C8E", fontSize: 9, textTransform: "uppercase" }}>Boundary Pts (B)</div>
                <div style={{ color: "#6B8075", fontSize: 16, fontWeight: 700, fontFamily: "monospace", marginTop: 2 }}>
                  {data.boundary_points_count}
                </div>
              </div>
              <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ color: "#888C8E", fontSize: 9, textTransform: "uppercase" }}>Tropical Genus (g)</div>
                <div style={{ color: "#C05640", fontSize: 16, fontWeight: 700, fontFamily: "monospace", marginTop: 2 }}>
                  {data.tropical_genus}
                </div>
              </div>
            </div>

            {/* Interior lattice points badge */}
            <div style={{ fontSize: 11, color: "#888C8E" }}>
              Interior Lattice Points (Independent 1-Cycles):{" "}
              <span style={{ color: "#D19E4A", fontFamily: "monospace", fontWeight: 700 }}>
                {data.interior_lattice_points.length > 0
                  ? data.interior_lattice_points.map((pt) => `(${pt[0]}, ${pt[1]})`).join(", ")
                  : "None (Genus 0)"}
              </span>
            </div>

            {/* Explanation narrative */}
            <div style={{ color: "#888C8E", fontSize: 11, lineHeight: 1.4, fontStyle: "italic" }}>
              {data.explanation}
            </div>
          </div>

              Newton Polygon &Delta;(P) &sub; &Ropf;&sup2;
          <div
            style={{
              background: "#0F1113",
              border: "1px solid #2C3133",
              borderRadius: 8,
              padding: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 10, color: "#888C8E", marginBottom: 4 }}>
              Newton Polygon &Delta;(P) &sub; &Ropf;&sup2;
            </div>

            <svg width={svgSize} height={svgSize} style={{ overflow: "visible" }}>
              {/* Grid Lines */}
              {Array.from({ length: maxCoord + 1 }).map((_, i) => (
                <React.Fragment key={i}>
                  <line
                    x1={toSvgX(i)}
                    y1={toSvgY(0)}
                    x2={toSvgX(i)}
                    y2={toSvgY(maxCoord)}
                    stroke="#1C1F21"
                    strokeWidth={1}
                  />
                  <line
                    x1={toSvgX(0)}
                    y1={toSvgY(i)}
                    x2={toSvgX(maxCoord)}
                    y2={toSvgY(i)}
                    stroke="#1C1F21"
                    strokeWidth={1}
                  />
                </React.Fragment>
              ))}

              {/* Axes */}
              <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(maxCoord)} y2={toSvgY(0)} stroke="#2C3133" strokeWidth={1.5} />
              <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(0)} y2={toSvgY(maxCoord)} stroke="#2C3133" strokeWidth={1.5} />

              Newton Polygon &Delta;(P) &sub; &Ropf;&sup2;
              {data.newton_polygon_vertices.length >= 3 && (
                <polygon
                  points={data.newton_polygon_vertices.map((p) => `${toSvgX(p[0])},${toSvgY(p[1])}`).join(" ")}
                  fill="#D19E4A15"
                  stroke="#D19E4A"
                  strokeWidth={2}
                />
              )}

              {/* Monomial Lattice Points */}
              {data.monomials.map((m, idx) => (
                <circle
                  key={idx}
                  cx={toSvgX(m.x_pow)}
                  cy={toSvgY(m.y_pow)}
                  r={3.5}
                  fill="#E6E4DF"
                  stroke="#141617"
                  strokeWidth={1}
                />
              ))}

              {/* Interior Lattice Points (Diamonds) */}
              {data.interior_lattice_points.map((pt, idx) => {
                const cx = toSvgX(pt[0]);
                const cy = toSvgY(pt[1]);
                return (
                  <polygon
                    key={`int-${idx}`}
                    points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`}
                    fill="#C05640"
                    stroke="#E6E4DF"
                    strokeWidth={1}
                  />
                );
              })}
            </svg>

            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 9, color: "#888C8E" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E6E4DF", display: "inline-block" }} />
                Monomial
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, background: "#C05640", transform: "rotate(45deg)", display: "inline-block" }} />
                Interior (Genus Cycle)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
