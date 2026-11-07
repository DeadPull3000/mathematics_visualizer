"use client";

import React from "react";
import { Domain } from "@/types/domain";

export interface ManifoldDropzoneProps {
  domain: Domain;
  manifoldShape: "Sphere" | "Torus" | "Custom";
  setManifoldShape: (s: "Sphere" | "Torus" | "Custom") => void;
  deformation: "none" | "stretch" | "ripple";
  setDeformation: (d: "none" | "stretch" | "ripple") => void;
  exprX: string;
  setExprX: (v: string) => void;
  exprY: string;
  setExprY: (v: string) => void;
  exprZ: string;
  setExprZ: (v: string) => void;
  uMin: string;
  setUMin: (v: string) => void;
  uMax: string;
  setUMax: (v: string) => void;
  vMin: string;
  setVMin: (v: string) => void;
  vMax: string;
  setVMax: (v: string) => void;
}

export function ManifoldDropzone({
  domain,
  manifoldShape,
  setManifoldShape,
  deformation,
  setDeformation,
  exprX,
  setExprX,
  exprY,
  setExprY,
  exprZ,
  setExprZ,
  uMin,
  setUMin,
  uMax,
  setUMax,
  vMin,
  setVMin,
  vMax,
  setVMax,
}: ManifoldDropzoneProps) {
  const shapes: {
    id: "Sphere" | "Torus" | "Custom";
    label: string;
    icon: string;
    desc: string;
    euler: string;
  }[] = [
    {
      id: "Sphere",
      label: "Sphere",
      icon: "◎",
      desc: "Simply-connected surface · genus 0",
      euler: "χ = 2",
    },
    {
      id: "Torus",
      label: "Torus",
      icon: "⊙",
      desc: "Surface with 1 handle · genus 1",
      euler: "χ = 0",
    },
    {
      id: "Custom",
      label: "Custom",
      icon: "∫",
      desc: "User-defined X(u,v), Y(u,v), Z(u,v)",
      euler: "χ = ?",
    },
  ];
  const deformations: { id: "none" | "stretch" | "ripple"; label: string; symbol: string }[] = [
    { id: "none", label: "Perfect (None)", symbol: "∅" },
    { id: "stretch", label: "Ellipsoid (Stretch)", symbol: "↕" },
    { id: "ripple", label: "Interference (Ripple)", symbol: "∿" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#111315",
    border: "1px solid #2C3133",
    borderRadius: 6,
    padding: "7px 10px",
    color: "#E6E4DF",
    fontSize: 12,
    fontFamily: "'Courier New', monospace",
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
        Select a manifold shape to generate a parametric mesh
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {shapes.map((s) => {
          const isActive = manifoldShape === s.id;
          return (
            <button
              key={s.id}
              id={`manifold-shape-${s.id.toLowerCase()}`}
              onClick={() => setManifoldShape(s.id)}
              style={{
                flex: 1,
                background: isActive ? `${domain.color}12` : "#111315",
                border: `1.5px solid ${isActive ? domain.color : "#2C3133"}`,
                borderRadius: 10,
                padding: "14px 10px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  marginBottom: 6,
                  color: isActive ? domain.color : "#888C8E",
                  transition: "color 0.15s",
                }}
              >
                {s.icon}
              </div>
              <div
                style={{
                  color: isActive ? "#E6E4DF" : "#888C8E",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 13,
                  marginBottom: 3,
                  transition: "color 0.15s",
                }}
              >
                {s.label}
              </div>
              <div style={{ color: "#555A5D", fontSize: 9, lineHeight: 1.4 }}>{s.desc}</div>
              <div
                style={{
                  marginTop: 6,
                  display: "inline-block",
                  background: isActive ? `${domain.color}20` : "#2C3133",
                  border: `1px solid ${isActive ? domain.color : "#2C3133"}`,
                  color: isActive ? domain.color : "#888C8E",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  transition: "all 0.15s",
                }}
              >
                {s.euler}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Custom Parametric Equation Editor ── */}
      {manifoldShape === "Custom" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              color: "#888C8E",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Parametric Equations
          </div>
          {/* X, Y, Z inputs */}
          {(
            [
              { label: "X(u,v)", value: exprX, set: setExprX },
              { label: "Y(u,v)", value: exprY, set: setExprY },
              { label: "Z(u,v)", value: exprZ, set: setExprZ },
            ] as { label: string; value: string; set: (v: string) => void }[]
          ).map(({ label, value, set }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  color: domain.color,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  width: 44,
                  flexShrink: 0,
                }}
              >
                {label} =
              </span>
              <input
                id={`expr-${label.replace("(u,v)", "").toLowerCase()}`}
                value={value}
                onChange={(e) => set(e.target.value)}
                style={inputStyle}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          ))}
          {/* u / v range inputs */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {(
              [
                { label: "u min", value: uMin, set: setUMin },
                { label: "u max", value: uMax, set: setUMax },
                { label: "v min", value: vMin, set: setVMin },
                { label: "v max", value: vMax, set: setVMax },
              ] as { label: string; value: string; set: (v: string) => void }[]
            ).map(({ label, value, set }) => (
              <div
                key={label}
                style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  style={{
                    color: "#555A5D",
                    fontSize: 9,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </span>
                <input
                  id={`range-${label.replace(" ", "-")}`}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  style={{ ...inputStyle, fontSize: 11, padding: "6px 8px" }}
                />
              </div>
            ))}
          </div>
          {/* Example hint block */}
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
            <span style={{ color: "#888C8E", fontWeight: 600 }}>Examples</span>
            <br />
            <span style={{ color: domain.color }}>Möbius Strip</span>
            {"  "}X: <code style={{ color: "#E6E4DF" }}>(2+v*cos(u/2))*cos(u)</code>
            {"  "}Y: <code style={{ color: "#E6E4DF" }}>(2+v*cos(u/2))*sin(u)</code>
            {"  "}Z: <code style={{ color: "#E6E4DF" }}>v*sin(u/2)</code>
            {"  "}u∈[0, 6.28], v∈[−1, 1]
            <br />
            <span style={{ color: domain.color }}>Catenoid</span>
            {"      "}X: <code style={{ color: "#E6E4DF" }}>cosh(v)*cos(u)</code>
            {"      "}Y: <code style={{ color: "#E6E4DF" }}>cosh(v)*sin(u)</code>
            {"      "}Z: <code style={{ color: "#E6E4DF" }}>v</code>
            {"                                "}u∈[0, 6.28], v∈[−2, 2]
          </div>
        </div>
      )}

      {/* ── Deformation selector (hidden for Custom — formula already encodes shape) ── */}
      {manifoldShape !== "Custom" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              color: "#888C8E",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Geometric Deformation
          </div>
          <div
            style={{
              display: "flex",
              gap: 0,
              border: "1px solid #2C3133",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {deformations.map((d, i) => {
              const isActive = deformation === d.id;
              return (
                <button
                  key={d.id}
                  id={`manifold-deformation-${d.id}`}
                  onClick={() => setDeformation(d.id)}
                  style={{
                    flex: 1,
                    background: isActive ? `${domain.color}18` : "transparent",
                    border: "none",
                    borderLeft: i > 0 ? "1px solid #2C3133" : "none",
                    padding: "9px 6px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    transition: "background 0.15s",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: isActive ? domain.color : "#555A5D",
                      transition: "color 0.15s",
                    }}
                  >
                    {d.symbol}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.04em",
                      color: isActive ? "#E6E4DF" : "#555A5D",
                      transition: "color 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          background: "#111315",
          border: "1px solid #2C3133",
          borderRadius: 10,
          padding: "14px 18px",
          color: "#888C8E",
          fontSize: 11,
          lineHeight: 1.9,
        }}
      >
        <span style={{ color: domain.color, fontWeight: 600, letterSpacing: "0.04em" }}>
          Laplacian Harmonics — Spectral Geometry
        </span>
        <br />
        The mesh Laplacian eigenvector partitions the surface into{" "}
        <span style={{ color: "#E6E4DF" }}>vibration modes</span>.
        <br />
        <span style={{ color: "#C05640" }}>Terracotta</span> = positive amplitude &nbsp;·&nbsp;
        <span style={{ color: "#6B8075" }}>Sage</span> = negative amplitude &nbsp;·&nbsp;
        <span style={{ color: "#D19E4A" }}>Ochre</span> = nodal line (≈ 0)
      </div>
    </div>
  );
}
