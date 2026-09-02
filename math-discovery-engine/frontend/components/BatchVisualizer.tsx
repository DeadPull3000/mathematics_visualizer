"use client";

import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { type BatchDataPoint } from "@/lib/api";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const TERRACOTTA = "#C05640"; // connected (β₀ = 1)
const SAGE       = "#6B8075"; // disconnected (β₀ > 1)
const GRID_COLOR = "#2C3133";
const BG_COLOR   = "#111315";
const AXIS_COLOR = "#555A5D";
const TEXT_COLOR = "#888C8E";

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function BatchTooltip({ active, payload }: { active?: boolean; payload?: { payload: BatchDataPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isConnected = d.betti_0 === 1;
  return (
    <div
      style={{
        background: "#1C1F21",
        border: `1px solid ${isConnected ? TERRACOTTA : SAGE}`,
        borderRadius: 10,
        padding: "12px 16px",
        fontSize: 11,
        lineHeight: 1.9,
        color: "#E6E4DF",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        minWidth: 200,
      }}
    >
      <div style={{ fontWeight: 700, color: isConnected ? TERRACOTTA : SAGE, marginBottom: 4, letterSpacing: "0.06em", fontSize: 10, textTransform: "uppercase" }}>
        {isConnected ? "● Connected" : "● Disconnected"}
      </div>
      {[
        ["Sample", `#${d.id}`],
        ["Vertices", d.vertices],
        ["Edges", d.edges],
        ["Density", d.density.toFixed(4)],
        ["Alg. Connectivity λ₂", d.algebraic_connectivity.toFixed(4)],
        ["β₀  (components)", d.betti_0],
      ].map(([label, value]) => (
        <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: TEXT_COLOR }}>{label}</span>
          <span style={{ fontFamily: "'Courier New', monospace", color: "#E6E4DF", fontWeight: 600 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BatchVisualizer
// ---------------------------------------------------------------------------

interface Props {
  data: BatchDataPoint[];
}

export default function BatchVisualizer({ data }: Props) {
  const stats = useMemo(() => {
    const connected    = data.filter((d) => d.betti_0 === 1);
    const disconnected = data.filter((d) => d.betti_0 > 1);
    const avgDensity   = data.reduce((s, d) => s + d.density, 0) / (data.length || 1);
    const avgAlgConn   = data.reduce((s, d) => s + d.algebraic_connectivity, 0) / (data.length || 1);
    const maxBetti     = Math.max(...data.map((d) => d.betti_0));
    return { connected: connected.length, disconnected: disconnected.length, avgDensity, avgAlgConn, maxBetti };
  }, [data]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary stat cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total Samples",   value: data.length,                    color: "#E6E4DF"  },
          { label: "Connected",       value: stats.connected,                color: TERRACOTTA },
          { label: "Disconnected",    value: stats.disconnected,             color: SAGE       },
          { label: "Avg. Density",    value: stats.avgDensity.toFixed(3),    color: "#D19E4A"  },
          { label: "Avg. λ₂",         value: stats.avgAlgConn.toFixed(3),   color: "#6B8075"  },
          { label: "Max β₀",          value: stats.maxBetti,                 color: "#888C8E"  },
        ].map((s) => (
          <div
            key={s.label}
            style={{ flex: "1 1 80px", background: "#1C1F21", border: "1px solid #2C3133", borderRadius: 10, padding: "12px 14px", textAlign: "center", minWidth: 80 }}
          >
            <div style={{ color: s.color, fontSize: 22, fontWeight: 700, fontFamily: "'Georgia', serif", lineHeight: 1, marginBottom: 5 }}>{s.value}</div>
            <div style={{ color: "#555A5D", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Legend row */}
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        {[
          { color: TERRACOTTA, label: "Connected  (β₀ = 1)" },
          { color: SAGE,       label: "Disconnected  (β₀ > 1)" },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: TEXT_COLOR }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 9, color: "#3A3F42", letterSpacing: "0.06em" }}>
          --- avg. density reference line
        </span>
      </div>

      {/* Scatter chart */}
      <div style={{ background: BG_COLOR, border: "1px solid #2C3133", borderRadius: 12, padding: "20px 20px 8px" }}>
        <div style={{ color: TEXT_COLOR, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
          Graph Density  ×  Algebraic Connectivity λ₂  —  {data.length} Erdős-Rényi samples
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 24, bottom: 28, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} opacity={0.6} />
            <XAxis
              type="number"
              dataKey="density"
              name="Graph Density"
              domain={[0, 1]}
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={{ stroke: GRID_COLOR }}
              axisLine={{ stroke: GRID_COLOR }}
              label={{ value: "Graph Density  ρ", position: "insideBottom", offset: -16, fill: TEXT_COLOR, fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="algebraic_connectivity"
              name="Algebraic Connectivity"
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={{ stroke: GRID_COLOR }}
              axisLine={{ stroke: GRID_COLOR }}
              label={{ value: "Algebraic Connectivity  λ₂", angle: -90, position: "insideLeft", offset: 10, fill: TEXT_COLOR, fontSize: 10 }}
            />
            {/* Avg density reference line */}
            <ReferenceLine
              x={stats.avgDensity}
              stroke="#3A3F42"
              strokeDasharray="4 4"
              label={{ value: "μρ", fill: "#3A3F42", fontSize: 9, position: "top" }}
            />
            <Tooltip content={<BatchTooltip />} cursor={{ fill: "#2C313340" }} />
            <Scatter data={data} isAnimationActive={false}>
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.id}`}
                  fill={entry.betti_0 === 1 ? TERRACOTTA : SAGE}
                  fillOpacity={0.75}
                  stroke={entry.betti_0 === 1 ? TERRACOTTA : SAGE}
                  strokeOpacity={0.3}
                  strokeWidth={1}
                  r={4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Footer note */}
      <div style={{ color: "#3A3F42", fontSize: 9, letterSpacing: "0.05em", lineHeight: 1.7 }}>
        Each point is a random Erdős-Rényi graph G(N, p) with N ∈ [5, 30] and p ∈ [0.05, 0.95].
        Algebraic Connectivity λ₂ is the second-smallest eigenvalue of the combinatorial Laplacian L = D − A.
        λ₂ = 0 iff the graph is disconnected (β₀ &gt; 1).
      </div>
    </div>
  );
}
