"use client";

import React from "react";
import { Domain } from "@/types/domain";

export interface AlgebraicDropzoneProps {
  domain: Domain;
  algebraicFormula: string;
  setAlgebraicFormula: (f: string) => void;
}

export function AlgebraicDropzone({
  domain,
  algebraicFormula,
  setAlgebraicFormula,
}: AlgebraicDropzoneProps) {
  const examples = [
    { label: "Cone", formula: "x**2 + y**2 - z**2" },
    { label: "Sphere", formula: "x**2 + y**2 + z**2 - 4" },
    { label: "Torus", formula: "(sqrt(x**2 + y**2) - 2)**2 + z**2 - 1" },
    { label: "Cusp", formula: "x**2 + y**2 - z**3" },
    { label: "Whitney", formula: "x**2 - y**2*z" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
        Enter an implicit equation F(x, y, z) = 0 — uses Python / numexpr syntax
      </div>
      <input
        id="algebraic-formula-input"
        value={algebraicFormula}
        onChange={(e) => setAlgebraicFormula(e.target.value)}
        placeholder="x**2 + y**2 - z**2"
        spellCheck={false}
        autoComplete="off"
        style={{
          width: "100%",
          background: "#111315",
          border: `1.5px solid ${domain.color}40`,
          borderRadius: 8,
          padding: "12px 14px",
          color: "#E6E4DF",
          fontSize: 13,
          fontFamily: "'Courier New', monospace",
          outline: "none",
          transition: "border-color 0.2s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          (e.target as HTMLInputElement).style.borderColor = domain.color;
        }}
        onBlur={(e) => {
          (e.target as HTMLInputElement).style.borderColor = `${domain.color}40`;
        }}
      />
      {/* Quick-pick example formulas */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {examples.map(({ label, formula }) => (
          <button
            key={label}
            onClick={() => setAlgebraicFormula(formula)}
            style={{
              background: algebraicFormula === formula ? `${domain.color}30` : "#1C1F21",
              border: `1px solid ${algebraicFormula === formula ? domain.color : "#2C3133"}`,
              borderRadius: 6,
              padding: "4px 10px",
              color: algebraicFormula === formula ? domain.color : "#888C8E",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              transition: "all 0.15s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>
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
        <span style={{ color: "#888C8E", fontWeight: 600 }}>Syntax</span>
        {"  "}
        <code style={{ color: "#E6E4DF" }}>**</code> powers
        {"  ·  "}
        <code style={{ color: "#E6E4DF" }}>sqrt()</code>
        {"  ·  "}
        <code style={{ color: "#E6E4DF" }}>sin() cos() exp()</code>
        {"  ·  variables: "}
        <code style={{ color: domain.color }}>x y z</code>
      </div>
    </div>
  );
}
