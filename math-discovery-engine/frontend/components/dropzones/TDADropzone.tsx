"use client";

import React from "react";
import { Domain } from "@/types/domain";

export interface TDADropzoneProps {
  domain: Domain;
  shape: "noisy_circle" | "noisy_sphere" | "random_noise";
  setShape: (s: "noisy_circle" | "noisy_sphere" | "random_noise") => void;
  numPoints: number;
  setNumPoints: (n: number) => void;
  noiseLevel: number;
  setNoiseLevel: (l: number) => void;
  onCompute: () => void;
  isLoading: boolean;
}

export function TDADropzone({
  domain,
  shape,
  setShape,
  numPoints,
  setNumPoints,
  noiseLevel,
  setNoiseLevel,
  onCompute,
  isLoading,
}: TDADropzoneProps) {
  const shapes: {
    id: "noisy_circle" | "noisy_sphere" | "random_noise";
    label: string;
    desc: string;
    icon: string;
  }[] = [
    {
      id: "noisy_circle",
      label: "Noisy Circle",
      desc: "S¹ with Gaussian jitter · prominent 1D cycle H₁",
      icon: "◯",
    },
    {
      id: "noisy_sphere",
      label: "Noisy Sphere",
      desc: "S² spherical surface · 2D topology · trivial H₁",
      icon: "🌐",
    },
    {
      id: "random_noise",
      label: "Pure Noise",
      desc: "Uniform [-1, 1]³ box · stochastic null hypothesis",
      icon: "⁘",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
          Select point cloud manifold geometry and calibrate Vietoris-Rips filtration
        </div>
        <button
          onClick={onCompute}
          disabled={isLoading}
          style={{
            background: `${domain.color}25`,
            border: `1px solid ${domain.color}`,
            borderRadius: 6,
            color: domain.color,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "5px 14px",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => {
            if (!isLoading)
              (e.currentTarget as HTMLButtonElement).style.background = `${domain.color}40`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = `${domain.color}25`;
          }}
        >
          <span>⧖</span>
          {isLoading ? "Computing…" : "Compute Homology"}
        </button>
      </div>

      {/* Shape selection buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
        }}
      >
        {shapes.map((s) => {
          const isSelected = shape === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setShape(s.id)}
              style={{
                background: isSelected ? `${domain.color}25` : "#111315",
                border: `1.5px solid ${isSelected ? domain.color : "#2C3133"}`,
                borderRadius: 8,
                padding: "12px 14px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    color: isSelected ? "#E6E4DF" : "#888C8E",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {s.icon} {s.label}
                </span>
                {isSelected && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: domain.color,
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  color: isSelected ? "#E6E4DF" : "#555A5D",
                  fontSize: 10,
                  lineHeight: 1.4,
                }}
              >
                {s.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sliders: Sample Points & Noise Level */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Sample Count */}
        <div
          style={{
            background: "#111315",
            border: "1px solid #2C3133",
            borderRadius: 8,
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span
              style={{
                color: "#888C8E",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Sample Points |X|
            </span>
            <span
              style={{
                color: domain.color,
                fontFamily: "'Courier New', monospace",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {numPoints}
            </span>
          </div>
          <input
            type="range"
            min={40}
            max={300}
            step={10}
            value={numPoints}
            onChange={(e) => setNumPoints(Number(e.target.value))}
            style={{ width: "100%", accentColor: domain.color }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#3A3F42",
              fontSize: 9,
            }}
          >
            <span>40</span>
            <span>150 (optimal)</span>
            <span>300</span>
          </div>
        </div>

        {/* Noise Level */}
        <div
          style={{
            background: "#111315",
            border: "1px solid #2C3133",
            borderRadius: 8,
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span
              style={{
                color: "#888C8E",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Noise Level (σ)
            </span>
            <span
              style={{
                color: domain.color,
                fontFamily: "'Courier New', monospace",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {noiseLevel.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.0}
            max={0.4}
            step={0.02}
            value={noiseLevel}
            onChange={(e) => setNoiseLevel(Number(e.target.value))}
            style={{ width: "100%", accentColor: domain.color }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#3A3F42",
              fontSize: 9,
            }}
          >
            <span>0.00 (clean)</span>
            <span>0.15 (standard)</span>
            <span>0.40 (heavy)</span>
          </div>
        </div>
      </div>

      {/* Mathematical Reference Note */}
      <div
        style={{
          background: "#111315",
          border: "1px solid #2C3133",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 10,
          lineHeight: 1.8,
          color: "#555A5D",
        }}
      >
        <span style={{ color: "#888C8E", fontWeight: 600 }}>Vietoris-Rips Complex: </span>
        Simplices formed when pairwise distance ≤ 2ε.
        {"  ·  "}
        <span style={{ color: "#6B8075" }}>H₀</span> connected clusters
        {"  ·  "}
        <span style={{ color: "#C05640" }}>H₁</span> persistent 1D loops
      </div>
    </div>
  );
}
