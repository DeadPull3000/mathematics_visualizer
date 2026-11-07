"use client";

import React from "react";
import { Domain } from "@/types/domain";

export interface EmptyMicroscopeProps {
  domain: Domain;
}

export function EmptyMicroscope({ domain }: EmptyMicroscopeProps) {
  return (
    <div style={{ textAlign: "center", maxWidth: 380 }}>
      <div
        style={{
          position: "relative",
          width: 120,
          height: 120,
          margin: "0 auto 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              borderRadius: "50%",
              border: `1px solid ${domain.color}`,
              width: i * 36,
              height: i * 36,
              opacity: 0.15 + i * 0.1,
              animation: `pulse ${1.8 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
        <span
          style={{
            fontSize: 28,
            color: domain.color,
            opacity: 0.6,
            position: "relative",
            zIndex: 1,
          }}
        >
          {domain.icon}
        </span>
      </div>
      <div
        style={{
          color: "#E6E4DF",
          fontSize: 15,
          fontWeight: 500,
          marginBottom: 8,
        }}
      >
        Awaiting Mathematical Object
      </div>
      <div style={{ color: "#888C8E", fontSize: 12, lineHeight: 1.7 }}>
        Input a <span style={{ color: domain.color }}>{domain.label.toLowerCase()}</span> structure
        above and click{" "}
        <span style={{ color: domain.color, fontWeight: 600 }}>Discover Structure</span>.
        <br />
        The 1-skeleton and invariants will render here.
      </div>
      <div
        style={{
          marginTop: 24,
          padding: "10px 16px",
          background: "#1C1F21",
          borderRadius: 8,
          border: "1px solid #2C3133",
          color: "#888C8E",
          fontSize: 11,
          lineHeight: 1.6,
        }}
      >
        🔬 1-skeleton · β₀ Betti number · Density · Planarity · Persistent homology (Step 3)
      </div>
    </div>
  );
}
