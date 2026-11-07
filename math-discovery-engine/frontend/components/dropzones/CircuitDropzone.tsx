"use client";

import React from "react";
import { Domain } from "@/types/domain";

export interface CircuitDropzoneProps {
  domain: Domain;
  circuitFormula: string;
  setCircuitFormula: (f: string) => void;
}

export function CircuitDropzone({
  domain,
  circuitFormula,
  setCircuitFormula,
}: CircuitDropzoneProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
        Enter a boolean logic formula to generate its circuit DAG
      </div>
      <div style={{ position: "relative" }}>
        <input
          id="circuit-formula-input"
          value={circuitFormula}
          onChange={(e) => setCircuitFormula(e.target.value)}
          placeholder="(x1 & x2) | (~x3 & x4)"
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
        <span style={{ color: "#888C8E", fontWeight: 600 }}>Supported gates</span>
        <br />
        <span style={{ color: domain.color }}>& </span>
        <code style={{ color: "#E6E4DF" }}>AND</code>
        {"   "}
        <span style={{ color: domain.color }}>| </span>
        <code style={{ color: "#E6E4DF" }}>OR</code>
        {"   "}
        <span style={{ color: domain.color }}>^ </span>
        <code style={{ color: "#E6E4DF" }}>XOR</code>
        {"   "}
        <span style={{ color: domain.color }}>~ </span>
        <code style={{ color: "#E6E4DF" }}>NOT</code>
        <br />
        <span style={{ color: "#888C8E", fontWeight: 600 }}>Example: </span>
        <code style={{ color: "#E6E4DF" }}>(x1 & x2) | (~x3 & x4)</code>
        {"  "}·{"  "}
        <code style={{ color: "#E6E4DF" }}>x1 ^ (x2 | ~x3)</code>
      </div>
    </div>
  );
}
