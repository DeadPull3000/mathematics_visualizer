"use client";

import React from "react";
import { WLResponse } from "@/lib/api";
import GraphVisualizer from "@/components/GraphVisualizer";

export interface WLResultViewProps {
  wlResult: WLResponse;
  wlStep: number;
  setWlStep: (s: number) => void;
}

export function WLResultView({
  wlResult,
  wlStep,
  setWlStep,
}: WLResultViewProps) {
  const maxSteps = wlResult.wl_steps1.length - 1;
  const isIsomorphic = wlResult.is_isomorphic;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Badge */}
      <div
        style={{
          background: isIsomorphic ? "#6B807520" : "#C0564020",
          border: `1px solid ${isIsomorphic ? "#6B8075" : "#C05640"}`,
          borderRadius: 10,
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: isIsomorphic ? "#6B8075" : "#C05640",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Result: {isIsomorphic ? "ISOMORPHIC (Mathematical Twins)" : "NON-ISOMORPHIC"}
        </div>
      </div>

      {/* Split-screen graphs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
              color: "#888C8E",
              fontSize: 10,
              marginBottom: 10,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Graph A
          </div>
          <GraphVisualizer
            nodes={wlResult.graph1_nodes.map((n) => n.id)}
            edges={wlResult.graph1_edges as (string | number)[][]}
            wlColors={wlResult.wl_steps1[wlStep]}
            viewMode="spectral"
            height={300}
          />
        </div>
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
              color: "#888C8E",
              fontSize: 10,
              marginBottom: 10,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Graph B
          </div>
          <GraphVisualizer
            nodes={wlResult.graph2_nodes.map((n) => n.id)}
            edges={wlResult.graph2_edges as (string | number)[][]}
            wlColors={wlResult.wl_steps2[wlStep]}
            viewMode="spectral"
            height={300}
          />
        </div>
      </div>

      {/* Playback Control */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1C1F21",
          border: "1px solid #2C3133",
          borderRadius: 10,
          padding: "14px 20px",
        }}
      >
        <div style={{ color: "#E6E4DF", fontSize: 13, fontWeight: 600 }}>
          WL Iteration Step: <span style={{ color: "#D19E4A" }}>{wlStep}</span> of {maxSteps}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setWlStep(0)}
            disabled={wlStep === 0}
            style={{
              background: "#2C3133",
              border: "none",
              borderRadius: 6,
              color: wlStep === 0 ? "#555A5D" : "#E6E4DF",
              padding: "6px 14px",
              cursor: wlStep === 0 ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            Reset
          </button>
          <button
            onClick={() => setWlStep(wlStep + 1)}
            disabled={wlStep >= maxSteps}
            style={{
              background: wlStep >= maxSteps ? "#2C3133" : "#D19E4A",
              border: "none",
              borderRadius: 6,
              color: wlStep >= maxSteps ? "#555A5D" : "#111315",
              padding: "6px 14px",
              fontWeight: 600,
              cursor: wlStep >= maxSteps ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            Next Iteration
          </button>
        </div>
      </div>
    </div>
  );
}
