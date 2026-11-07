"use client";

import React from "react";
import { Domain } from "@/types/domain";

export interface KnotDropzoneProps {
  domain: Domain;
  knotFormula: string;
  setKnotFormula: (v: string) => void;
}

export function KnotDropzone({
  domain,
  knotFormula,
  setKnotFormula,
}: KnotDropzoneProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
        Enter a torus knot formula
      </div>
      <input
        id="knot-formula-input"
        type="text"
        value={knotFormula}
        onChange={(e) => setKnotFormula(e.target.value)}
        placeholder="e.g.  T_3_2  or  T_5_3"
        style={{
          background: "#111315",
          border: "1px solid #2C3133",
          borderRadius: 10,
          color: "#E6E4DF",
          fontFamily: "'Georgia', serif",
          fontSize: 22,
          padding: "16px 18px",
          outline: "none",
          transition: "border-color 0.15s",
          letterSpacing: "0.1em",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = domain.color;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#2C3133";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      <div
        style={{
          background: "#111315",
          border: "1px solid #2C3133",
          borderRadius: 10,
          padding: "16px 18px",
          color: "#888C8E",
          fontSize: 11,
          lineHeight: 2,
        }}
      >
        <span style={{ color: domain.color, fontWeight: 600, letterSpacing: "0.04em" }}>
          Supported knots — T_p_q (Torus Knots)
        </span>
        <br />
        <code style={{ color: "#E6E4DF" }}>T_3_2</code>  — Trefoil knot  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <span style={{ color: "#D19E4A", fontFamily: "'Georgia',serif", fontSize: 12 }}>c = 3</span>
        <br />
        <code style={{ color: "#E6E4DF" }}>T_5_2</code>  — Cinquefoil knot &nbsp;&nbsp;
        <span style={{ color: "#D19E4A", fontFamily: "'Georgia',serif", fontSize: 12 }}>c = 5</span>
        <br />
        <code style={{ color: "#E6E4DF" }}>T_5_3</code>  — Torus knot (5,3) &nbsp;
        <span style={{ color: "#D19E4A", fontFamily: "'Georgia',serif", fontSize: 12 }}>c = 8</span>
        <br />
        <code style={{ color: "#E6E4DF" }}>T_7_2</code>  — Heptafoil knot &nbsp;&nbsp;
        <span style={{ color: "#D19E4A", fontFamily: "'Georgia',serif", fontSize: 12 }}>c = 7</span>
        <br />
        <span style={{ color: "#2C3133", fontSize: 10 }}>
          Formula: c = min(p(q−1), q(p−1)) · Both p, q must be coprime integers ≥ 2
        </span>
      </div>
    </div>
  );
}
