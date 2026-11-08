"use client";

import React, { useState } from "react";
import { IharaResponse, RicciResponse, computeIharaZeta, computeOllivierRicci } from "@/lib/api";

interface FrontiersInspectorProps {
  initialIhara?: IharaResponse | null;
  initialRicci?: RicciResponse | null;
  nodes: (number | string)[];
  edges: (number | string)[][];
}

export function FrontiersInspector({
  initialIhara,
  initialRicci,
  nodes,
  edges,
}: FrontiersInspectorProps) {
  const [activeTab, setActiveTab] = useState<"ihara" | "ricci">("ihara");
  const [ihara, setIhara] = useState<IharaResponse | null>(initialIhara ?? null);
  const [ricci, setRicci] = useState<RicciResponse | null>(initialRicci ?? null);
  const [loading, setLoading] = useState(false);
  const [hoveredPole, setHoveredPole] = useState<{ re: number; im: number; abs: number } | null>(null);

  // If initial data wasn't pre-computed, allow one-click calculation
  const handleFetchIhara = async () => {
    setLoading(true);
    try {
      const edgeListStr = edges.map((e) => `${e[0]} ${e[1]}`).join("\n");
      const res = await computeIharaZeta(edgeListStr, "edge_list");
      setIhara(res);
    } catch (err) {
      console.error("Failed to compute Ihara zeta:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRicci = async () => {
    setLoading(true);
    try {
      const edgeListStr = edges.map((e) => `${e[0]} ${e[1]}`).join("\n");
      const res = await computeOllivierRicci(edgeListStr, "edge_list", 0.0);
      setRicci(res);
    } catch (err) {
      console.error("Failed to compute Ricci curvature:", err);
    } finally {
      setLoading(false);
    }
  };

  // Complex plane plotting constants
  const svgSize = 220;
  const center = svgSize / 2;
  const scale = 80; // 1.0 unit = 80px

  return (
    <div
      style={{
        background: "#1C1F21",
        border: "1px solid #2C3133",
        borderRadius: 10,
        padding: "18px 20px",
        marginTop: 6,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🌌</span>
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
              Mathematical Frontiers
            </div>
            <div style={{ color: "#888C8E", fontSize: 11 }}>
              Ihara Zeta Function, Ramanujan Expander & Ollivier-Ricci Curvature
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div style={{ display: "flex", background: "#141617", borderRadius: 6, padding: 2, border: "1px solid #2C3133" }}>
          <button
            onClick={() => setActiveTab("ihara")}
            style={{
              background: activeTab === "ihara" ? "#2C3133" : "transparent",
              color: activeTab === "ihara" ? "#D19E4A" : "#888C8E",
              border: "none",
              borderRadius: 4,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Ihara Zeta & Ramanujan
          </button>
          <button
            onClick={() => setActiveTab("ricci")}
            style={{
              background: activeTab === "ricci" ? "#2C3133" : "transparent",
              color: activeTab === "ricci" ? "#6B8075" : "#888C8E",
              border: "none",
              borderRadius: 4,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Ollivier-Ricci Curvature
          </button>
        </div>
      </div>

      {/* ── TAB 1: IHARA ZETA & RAMANUJAN ── */}
      {activeTab === "ihara" && (
        <div>
          {!ihara ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ color: "#888C8E", fontSize: 12, marginBottom: 10 }}>
                Compute Bass's determinant formula, non-backtracking poles, and Ramanujan verification.
              </p>
              <button
                onClick={handleFetchIhara}
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
                {loading ? "Evaluating Bass Determinant..." : "Compute Ihara Zeta Function"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Badges strip */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {ihara.is_regular ? (
                  ihara.is_ramanujan ? (
                    <div
                      style={{
                        background: "#6B807525",
                        border: "1px solid #6B807580",
                        color: "#6B8075",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>✓</span>
                      <span>Ramanujan Expander (λ₂ ≤ 2√(d−1))</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "#C0564025",
                        border: "1px solid #C0564080",
                        color: "#C05640",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Non-Ramanujan (λ₂ &gt; 2√(d−1))
                    </div>
                  )
                ) : (
                  <div
                    style={{
                      background: "#2C3133",
                      color: "#E6E4DF",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                    }}
                  >
                    Irregular Graph (d̄ = {ihara.degree.toFixed(2)})
                  </div>
                )}

                <div
                  style={{
                    background: "#141617",
                    border: "1px solid #2C3133",
                    color: "#D19E4A",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  Rank r = {ihara.cyclomatic_rank}
                </div>

                {ihara.girth && (
                  <div
                    style={{
                      background: "#141617",
                      border: "1px solid #2C3133",
                      color: "#888C8E",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                    }}
                  >
                    Girth g = <span style={{ color: "#E6E4DF", fontWeight: 700 }}>{ihara.girth}</span>
                  </div>
                )}

                <div
                  style={{
                    background: "#141617",
                    border: "1px solid #2C3133",
                    color: "#888C8E",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 11,
                  }}
                >
                  Poles: <span style={{ color: "#E6E4DF", fontWeight: 700 }}>{ihara.poles_count}</span>
                </div>
              </div>

              {/* Layout: Formula & Stats on left, Complex Pole Diagram on right */}
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Bass Formula card */}
                  <div
                    style={{
                      background: "#141617",
                      border: "1px solid #2C3133",
                      borderRadius: 8,
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ color: "#888C8E", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      Bass Determinant Identity (1992)
                    </div>
                    <div style={{ color: "#D19E4A", fontFamily: "'Courier New', monospace", fontSize: 11, lineHeight: 1.5 }}>
                      {ihara.latex_formula}
                    </div>
                  </div>

                  {/* Spectral Details */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                    <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 6, padding: "8px 10px" }}>
                      <span style={{ color: "#888C8E" }}>Second Eig |λ₂|:</span>{" "}
                      <span style={{ color: "#E6E4DF", fontWeight: 700, fontFamily: "monospace" }}>
                        {ihara.lambda_2.toFixed(4)}
                      </span>
                    </div>
                    <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 6, padding: "8px 10px" }}>
                      <span style={{ color: "#888C8E" }}>Ramanujan Bound:</span>{" "}
                      <span style={{ color: "#6B8075", fontWeight: 700, fontFamily: "monospace" }}>
                        {ihara.ramanujan_bound.toFixed(4)}
                      </span>
                    </div>
                    <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 6, padding: "8px 10px" }}>
                      <span style={{ color: "#888C8E" }}>Critical Circle:</span>{" "}
                      <span style={{ color: "#C05640", fontWeight: 700, fontFamily: "monospace" }}>
                        r = {ihara.critical_radius.toFixed(4)}
                      </span>
                    </div>
                    <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 6, padding: "8px 10px" }}>
                      <span style={{ color: "#888C8E" }}>Graph Riemann Hyp:</span>{" "}
                      <span style={{ color: ihara.is_ramanujan ? "#6B8075" : "#D19E4A", fontWeight: 700 }}>
                        {ihara.is_ramanujan ? "Verified ✓" : "Off-Circle"}
                      </span>
                    </div>
                  </div>

                  {/* Explanation note */}
                  <div style={{ color: "#888C8E", fontSize: 11, lineHeight: 1.4, fontStyle: "italic" }}>
                    {ihara.explanation}
                  </div>
                </div>

                    Complex Plane &Copf; &mdash; Non-Backtracking Poles
                <div
                  style={{
                    background: "#0F1113",
                    border: "1px solid #2C3133",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: 10, color: "#888C8E", marginBottom: 4 }}>
                    Complex Plane &Copf; &mdash; Non-Backtracking Poles
                  </div>

                  <svg width={svgSize} height={svgSize} style={{ overflow: "visible" }}>
                    {/* Axes */}
                    <line x1={0} y1={center} x2={svgSize} y2={center} stroke="#2C3133" strokeWidth={1} />
                    <line x1={center} y1={0} x2={center} y2={svgSize} stroke="#2C3133" strokeWidth={1} />

                    {/* Unit circle |u| = 1 */}
                    <circle cx={center} cy={center} r={scale} fill="none" stroke="#2C3133" strokeWidth={1} strokeDasharray="3,3" />

                    {/* Critical circle |u| = 1/sqrt(d-1) */}
                    {ihara.critical_radius > 0 && ihara.critical_radius < 2 && (
                      <circle
                        cx={center}
                        cy={center}
                        r={ihara.critical_radius * scale}
                        fill="none"
                        stroke="#C05640"
                        strokeWidth={1.5}
                        strokeDasharray="4,3"
                      />
                    )}

                    {/* Render Poles */}
                    {ihara.poles.map((p, idx) => {
                      const px = center + p.re * scale;
                      const py = center - p.im * scale; // invert y for SVG
                      const isHovered = hoveredPole === p;
                      return (
                        <circle
                          key={idx}
                          cx={px}
                          cy={py}
                          r={isHovered ? 4.5 : 2.5}
                          fill={Math.abs(p.abs - ihara.critical_radius) < 0.05 ? "#6B8075" : "#D19E4A"}
                          stroke="#141617"
                          strokeWidth={1}
                          onMouseEnter={() => setHoveredPole(p)}
                          onMouseLeave={() => setHoveredPole(null)}
                          style={{ cursor: "pointer", transition: "all 0.1s ease" }}
                        />
                      );
                    })}
                  </svg>

                  {/* Tooltip */}
                  <div style={{ minHeight: 18, marginTop: 4, fontSize: 10, fontFamily: "monospace", color: "#D19E4A" }}>
                    {hoveredPole ? (
                      `u = ${hoveredPole.re >= 0 ? "+" : ""}${hoveredPole.re.toFixed(3)} ${hoveredPole.im >= 0 ? "+" : ""}${hoveredPole.im.toFixed(3)}i (|u| = ${hoveredPole.abs.toFixed(3)})`
                    ) : (
                      <span style={{ color: "#888C8E" }}>Hover over a pole to inspect coordinates</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: OLLIVIER-RICCI CURVATURE ── */}
      {activeTab === "ricci" && (
        <div>
          {!ricci ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ color: "#888C8E", fontSize: 12, marginBottom: 10 }}>
                Compute edge Ollivier-Ricci curvature using optimal transport Earth Mover's Distance.
              </p>
              <button
                onClick={handleFetchRicci}
                disabled={loading}
                style={{
                  background: "#2C3133",
                  color: "#6B8075",
                  border: "1px solid #6B807550",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {loading ? "Solving Optimal Transport LP..." : "Compute Ollivier-Ricci Curvature"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Summary Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ color: "#888C8E", fontSize: 10, textTransform: "uppercase" }}>Scalar Curvature</div>
                  <div style={{ color: ricci.average_curvature >= 0 ? "#6B8075" : "#C05640", fontSize: 18, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                    {ricci.average_curvature.toFixed(3)}
                  </div>
                </div>
                <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ color: "#888C8E", fontSize: 10, textTransform: "uppercase" }}>Min Curvature (Bottleneck)</div>
                  <div style={{ color: "#C05640", fontSize: 18, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                    {ricci.min_curvature.toFixed(3)}
                  </div>
                </div>
                <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ color: "#888C8E", fontSize: 10, textTransform: "uppercase" }}>Max Curvature (Clique)</div>
                  <div style={{ color: "#6B8075", fontSize: 18, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                    {ricci.max_curvature.toFixed(3)}
                  </div>
                </div>
                <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ color: "#888C8E", fontSize: 10, textTransform: "uppercase" }}>Bottleneck Bridges</div>
                  <div style={{ color: ricci.bottlenecks.length > 0 ? "#C05640" : "#888C8E", fontSize: 18, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                    {ricci.bottlenecks.length}
                  </div>
                </div>
              </div>

              {/* Explanation note */}
              <div style={{ color: "#888C8E", fontSize: 11, lineHeight: 1.4, fontStyle: "italic" }}>
                {ricci.explanation}
              </div>

              {/* Edge List Table */}
              <div style={{ background: "#141617", border: "1px solid #2C3133", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: "#0F1113", borderBottom: "1px solid #2C3133", fontSize: 10, color: "#888C8E", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", justifyContent: "space-between" }}>
                  <span>Edge (u, v)</span>
                  <span>Ollivier-Ricci Curvature κ</span>
                  <span>Geometric Classification</span>
                </div>
                <div style={{ maxHeight: 180, overflowY: "auto" }}>
                  {ricci.edges.map((e, idx) => {
                    const isBottleneck = e.type === "bottleneck";
                    const isCluster = e.type === "cluster";
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 12px",
                          borderBottom: "1px solid #1C1F21",
                          fontSize: 11,
                          fontFamily: "'Courier New', monospace",
                          background: isBottleneck ? "#C0564010" : isCluster ? "#6B807510" : "transparent",
                        }}
                      >
                        <span style={{ color: "#E6E4DF" }}>({e.u}, {e.v})</span>
                        <span style={{ color: e.curvature > 0 ? "#6B8075" : e.curvature < 0 ? "#C05640" : "#888C8E", fontWeight: 700 }}>
                          {e.curvature >= 0 ? "+" : ""}{e.curvature.toFixed(4)}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 600,
                            background: isBottleneck ? "#C0564030" : isCluster ? "#6B807530" : "#2C3133",
                            color: isBottleneck ? "#C05640" : isCluster ? "#6B8075" : "#888C8E",
                          }}
                        >
                          {isBottleneck ? "Bottleneck / Bridge" : isCluster ? "Dense Cluster Core" : "Ricci Flat"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
