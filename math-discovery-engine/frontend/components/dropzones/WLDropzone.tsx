"use client";

import React from "react";
import { Domain } from "@/types/domain";

export interface WLDropzoneProps {
  domain: Domain;
  formula1: string;
  setFormula1: (v: string) => void;
  formula2: string;
  setFormula2: (v: string) => void;
}

export function WLDropzone({
  domain,
  formula1,
  setFormula1,
  formula2,
  setFormula2,
}: WLDropzoneProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            color: "#888C8E",
            fontSize: 11,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Graph A
        </div>
        <textarea
          value={formula1}
          onChange={(e) => setFormula1(e.target.value)}
          placeholder="E.g., C_6 or paste an edge list"
          style={{
            minHeight: 120,
            background: "#111315",
            border: "1px solid #2C3133",
            borderRadius: 8,
            color: "#E6E4DF",
            padding: "12px 14px",
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            outline: "none",
            resize: "vertical",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = domain.color;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#2C3133";
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            color: "#888C8E",
            fontSize: 11,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Graph B
        </div>
        <textarea
          value={formula2}
          onChange={(e) => setFormula2(e.target.value)}
          placeholder="E.g., C_6 or paste an edge list"
          style={{
            minHeight: 120,
            background: "#111315",
            border: "1px solid #2C3133",
            borderRadius: 8,
            color: "#E6E4DF",
            padding: "12px 14px",
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            outline: "none",
            resize: "vertical",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = domain.color;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#2C3133";
          }}
        />
      </div>
    </div>
  );
}
