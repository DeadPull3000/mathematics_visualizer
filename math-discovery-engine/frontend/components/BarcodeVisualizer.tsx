"use client";

import React, { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// "Chalk, Slate, and Terracotta" Palette Constants
// ---------------------------------------------------------------------------

const TERRACOTTA = "#C05640"; // H1 1D Loops / Holes
const SAGE       = "#6B8075"; // H0 0D Connected Components
const OCHRE      = "#D19E4A"; // Highlights / Accents
const BG_DARK    = "#111315"; // Obsidian Slate base
const CARD_BG    = "#1C1F21"; // Chalkboard Grey
const BORDER     = "#2C3133"; // Slate Joint
const TEXT_MUTED = "#888C8E"; // Faded Lead
const TEXT_LIGHT = "#E6E4DF"; // Warm Alabaster

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

export interface BarcodeVisualizerProps {
  barcodes: {
    H0: [number, number][];
    H1: [number, number][];
  };
}

export default function BarcodeVisualizer({ barcodes }: BarcodeVisualizerProps) {
  const [hoveredFeature, setHoveredFeature] = useState<{
    dim: "H0" | "H1";
    index: number;
    birth: number;
    death: number;
    lifespan: number;
  } | null>(null);

  // 1. Calculate the absolute maximum death value across all H0 and H1 pairs
  const { maxDeath, h0Sorted, h1Sorted, maxH1Lifespan } = useMemo(() => {
    const h0 = barcodes?.H0 ?? [];
    const h1 = barcodes?.H1 ?? [];

    let highest = 0;
    for (const [b, d] of [...h0, ...h1]) {
      if (Number.isFinite(d) && d > highest) highest = d;
      else if (Number.isFinite(b) && b > highest) highest = b;
    }

    const scaleMax = highest > 0 ? highest : 1.0;

    // Sort by persistence lifespan descending for clear analytical visual hierarchy
    const sortedH1 = [...h1].sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
    const sortedH0 = [...h0].sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));

    const maxLifespanH1 = sortedH1.length > 0 ? sortedH1[0][1] - sortedH1[0][0] : 0;

    return {
      maxDeath: scaleMax,
      h0Sorted: sortedH0,
      h1Sorted: sortedH1,
      maxH1Lifespan: maxLifespanH1,
    };
  }, [barcodes]);

  // Tick divisions at 0%, 25%, 50%, 75%, 100%
  const ticks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div
      style={{
        width: "100%",
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxSizing: "border-box",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 12,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: TERRACOTTA, fontSize: 13 }}>⧖</span>
          <span
            style={{
              color: TEXT_LIGHT,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Persistence Barcodes (Vietoris-Rips Filtration)
          </span>
        </div>

        {/* Dimension badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: `${TERRACOTTA}18`,
              border: `1px solid ${TERRACOTTA}60`,
              color: TERRACOTTA,
              padding: "3px 10px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            <span
              style={{
                width: 14,
                height: 4,
                background: TERRACOTTA,
                borderRadius: 2,
                display: "inline-block",
              }}
            />
            H₁ (1D Loops): {h1Sorted.length}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: `${SAGE}18`,
              border: `1px solid ${SAGE}60`,
              color: SAGE,
              padding: "3px 10px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            <span
              style={{
                width: 14,
                height: 4,
                background: SAGE,
                borderRadius: 2,
                display: "inline-block",
              }}
            />
            H₀ (0D Components): {h0Sorted.length}
          </span>
          {maxH1Lifespan > 0 && (
            <span
              style={{
                background: `${OCHRE}18`,
                border: `1px solid ${OCHRE}60`,
                color: OCHRE,
                padding: "3px 10px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              Max H₁ Lifespan: {maxH1Lifespan.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Feature hover inspection readout */}
      <div
        style={{
          minHeight: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          fontFamily: "'Courier New', monospace",
          color: TEXT_MUTED,
        }}
      >
        {hoveredFeature ? (
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span
              style={{
                color: hoveredFeature.dim === "H1" ? TERRACOTTA : SAGE,
                fontWeight: 700,
              }}
            >
              [{hoveredFeature.dim} Feature #{hoveredFeature.index + 1}]
            </span>
            <span>
              Birth ε:{" "}
              <strong style={{ color: TEXT_LIGHT }}>
                {hoveredFeature.birth.toFixed(3)}
              </strong>
            </span>
            <span>
              Death ε:{" "}
              <strong style={{ color: TEXT_LIGHT }}>
                {hoveredFeature.death.toFixed(3)}
              </strong>
            </span>
            <span>
              Lifespan Δ:{" "}
              <strong
                style={{
                  color: hoveredFeature.dim === "H1" ? TERRACOTTA : OCHRE,
                }}
              >
                {hoveredFeature.lifespan.toFixed(3)}
              </strong>
            </span>
          </div>
        ) : (
          <span style={{ color: "#555A5D", fontSize: 10 }}>
            Hover any barcode line to inspect exact filtration birth, death, and persistent lifespan.
          </span>
        )}
        <span style={{ color: "#555A5D", fontSize: 10 }}>
          Scale range: [0, {maxDeath.toFixed(2)}]
        </span>
      </div>

      {/* Main Barcode Display Container (overflow-y-auto) */}
      <div
        style={{
          position: "relative",
          background: BG_DARK,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: 340,
          overflowY: "auto",
        }}
      >
        {/* Background Vertical Reference Grid Lines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 14,
            right: 14,
            pointerEvents: "none",
          }}
        >
          {ticks.map((t) => (
            <div
              key={t}
              style={{
                position: "absolute",
                left: `${t * 100}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: t === 0 ? `${BORDER}80` : `${BORDER}40`,
                borderLeft: t === 0 ? `1px solid ${BORDER}` : "1px dashed #1E2224",
              }}
            />
          ))}
        </div>

        {/* ── Section 1: H1 Barcodes (1D Holes / Loops) ────────────────────── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                color: TERRACOTTA,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              H₁ — 1D Cycles / Holes ({h1Sorted.length})
            </span>
            <span style={{ color: "#555A5D", fontSize: 10 }}>
              (loops that persist across multiple filtration radii)
            </span>
          </div>

          {h1Sorted.length === 0 ? (
            <div
              style={{
                padding: "12px 14px",
                color: "#555A5D",
                fontSize: 11,
                fontStyle: "italic",
                background: "#141617",
                borderRadius: 6,
                border: `1px dashed ${BORDER}`,
              }}
            >
              No 1D topological holes detected in this point cloud configuration.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                padding: "4px 0",
              }}
            >
              {h1Sorted.map(([birth, death], idx) => {
                const left = Math.max(0, Math.min(100, (birth / maxDeath) * 100));
                const width = Math.max(
                  0.6,
                  Math.min(100 - left, ((death - birth) / maxDeath) * 100)
                );
                const lifespan = death - birth;
                const isProminent = maxH1Lifespan > 0 && lifespan > maxH1Lifespan * 0.4;

                return (
                  <div
                    key={`h1-${idx}`}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 10,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onMouseEnter={() =>
                      setHoveredFeature({
                        dim: "H1",
                        index: idx,
                        birth,
                        death,
                        lifespan,
                      })
                    }
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <div
                      title={`H1 Feature #${idx + 1}: Birth=${birth.toFixed(2)}, Death=${death.toFixed(2)} (Lifespan=${lifespan.toFixed(2)})`}
                      style={{
                        position: "absolute",
                        left: `${left}%`,
                        width: `${width}%`,
                        height: isProminent ? 8 : 6,
                        background: TERRACOTTA,
                        borderRadius: 3,
                        boxShadow: isProminent
                          ? `0 0 8px ${TERRACOTTA}80`
                          : "none",
                        cursor: "crosshair",
                        transition: "all 0.15s ease",
                        opacity: 0.92,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.height = "10px";
                        e.currentTarget.style.boxShadow = `0 0 12px ${TERRACOTTA}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.92";
                        e.currentTarget.style.height = isProminent ? "8px" : "6px";
                        e.currentTarget.style.boxShadow = isProminent
                          ? `0 0 8px ${TERRACOTTA}80`
                          : "none";
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider between H1 and H0 */}
        <div style={{ height: 1, background: BORDER, position: "relative", zIndex: 1 }} />

        {/* ── Section 2: H0 Barcodes (0D Components) ───────────────────────── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                color: SAGE,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              H₀ — 0D Connected Components ({h0Sorted.length})
            </span>
            <span style={{ color: "#555A5D", fontSize: 10 }}>
              (merging clusters; infinite bar denotes the final unified component)
            </span>
          </div>

          {h0Sorted.length === 0 ? (
            <div
              style={{
                padding: "12px 14px",
                color: "#555A5D",
                fontSize: 11,
                fontStyle: "italic",
                background: "#141617",
                borderRadius: 6,
                border: `1px dashed ${BORDER}`,
              }}
            >
              No 0D components available.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                padding: "4px 0",
              }}
            >
              {h0Sorted.map(([birth, death], idx) => {
                const left = Math.max(0, Math.min(100, (birth / maxDeath) * 100));
                const width = Math.max(
                  0.5,
                  Math.min(100 - left, ((death - birth) / maxDeath) * 100)
                );
                const lifespan = death - birth;

                return (
                  <div
                    key={`h0-${idx}`}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 6,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onMouseEnter={() =>
                      setHoveredFeature({
                        dim: "H0",
                        index: idx,
                        birth,
                        death,
                        lifespan,
                      })
                    }
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <div
                      title={`H0 Component #${idx + 1}: Birth=${birth.toFixed(2)}, Death=${death.toFixed(2)} (Lifespan=${lifespan.toFixed(2)})`}
                      style={{
                        position: "absolute",
                        left: `${left}%`,
                        width: `${width}%`,
                        height: 4,
                        background: SAGE,
                        borderRadius: 2,
                        cursor: "crosshair",
                        transition: "all 0.1s ease",
                        opacity: 0.85,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.height = "7px";
                        e.currentTarget.style.background = "#8BA397";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.85";
                        e.currentTarget.style.height = "4px";
                        e.currentTarget.style.background = SAGE;
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── X-Axis Scale & Calibration ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "0 14px",
        }}
      >
        {/* Axis Ticks and Labels */}
        <div style={{ position: "relative", width: "100%", height: 18 }}>
          {ticks.map((t) => {
            const val = t * maxDeath;
            return (
              <div
                key={t}
                style={{
                  position: "absolute",
                  left: `${t * 100}%`,
                  transform: t === 0 ? "none" : t === 1.0 ? "translateX(-100%)" : "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: t === 0 ? "flex-start" : t === 1.0 ? "flex-end" : "center",
                  gap: 2,
                }}
              >
                <div style={{ width: 1, height: 5, background: BORDER }} />
                <span
                  style={{
                    color: TEXT_MUTED,
                    fontSize: 9,
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: "0.02em",
                  }}
                >
                  {val.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Axis Title */}
        <div
          style={{
            textAlign: "center",
            color: TEXT_MUTED,
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Filtration Radius Scale (ε)
        </div>
      </div>
    </div>
  );
}
