"use client";

import React from "react";
import { Domain } from "@/types/domain";
import { TDAResponse } from "@/lib/api";
import GraphVisualizer from "@/components/GraphVisualizer";
import BarcodeVisualizer from "@/components/BarcodeVisualizer";

export interface TDAResultViewProps {
  tdaResult: TDAResponse;
  domain?: Domain;
}

export function TDAResultView({ tdaResult, domain: _domain }: TDAResultViewProps) {
  const h0Count = tdaResult.barcodes?.H0?.length ?? 0;
  const h1Count = tdaResult.barcodes?.H1?.length ?? 0;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary metric cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Point Cloud |X|", value: tdaResult.nodes.length, color: "#E6E4DF" },
          { label: "H₀ Components", value: h0Count, color: "#6B8075" },
          { label: "H₁ Loops", value: h1Count, color: "#C05640" },
          { label: "Metric Space", value: "ℝ³ Euclidean", color: "#D19E4A" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              flex: 1,
              minWidth: 140,
              background: "#1C1F21",
              border: "1px solid #2C3133",
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: card.color,
                fontSize: 24,
                fontWeight: 700,
                fontFamily: "'Georgia', serif",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                color: "#888C8E",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* 3D Point Cloud Visualizer (no edges) */}
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
              fontWeight: 600,
            }}
          >
            3D Point Cloud Metric Space (WebGL) · {tdaResult.nodes.length} Nodes
          </div>
          <span style={{ color: "#555A5D", fontSize: 9 }}>
            Orbit: Left drag · Pan: Right drag · Zoom: Wheel
          </span>
        </div>

        <GraphVisualizer
          nodes={tdaResult.nodes.map((n) => n.id)}
          edges={[]}
          knotNodes={tdaResult.nodes}
          viewMode="spectral"
          height={380}
        />
      </div>

      {/* Persistence Barcode Visualizer */}
      <BarcodeVisualizer barcodes={tdaResult.barcodes} />
    </div>
  );
}
