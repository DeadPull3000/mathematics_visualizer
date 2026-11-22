"use client";

import React from "react";
import { Domain, DOMAINS } from "@/types/domain";

export interface SidebarProps {
  selected: Domain;
  onSelect: (d: Domain) => void;
}

export function Sidebar({ selected, onSelect }: SidebarProps) {
  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        flexShrink: 0,
        background: "#1C1F21",
        borderRight: "1px solid #2C3133",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "0 20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>𝕄</span>
          <span
            style={{
              color: "#E6E4DF",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.02em",
              fontFamily: "'Georgia', serif",
            }}
          >
            Discovery Engine
          </span>
        </div>
        <span style={{ color: "#555A5D", fontSize: 10, letterSpacing: "0.08em" }}>
          PHASE 6 · v1.0
        </span>
      </div>

      <div
        style={{
          padding: "0 20px 12px",
          color: "#888C8E",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Mathematical Domain
      </div>

      {DOMAINS.map((d) => {
        const isActive = d.id === selected.id;
        const isLive =
          d.id === "combinatorics" ||
          d.id === "knot" ||
          d.id === "topology" ||
          d.id === "circuit" ||
          d.id === "algebraic-geometry" ||
          d.id === "batch-explorer" ||
          d.id === "tda" ||
          d.id === "wl_test";
        return (
          <button
            key={d.id}
            id={`domain-btn-${d.id}`}
            onClick={() => isLive && onSelect(d)}
            style={{
              background: isActive ? "#222628" : "transparent",
              border: "none",
              borderLeft: isActive ? `2px solid ${d.color}` : "2px solid transparent",
              cursor: isLive ? "pointer" : "default",
              padding: "12px 20px",
              textAlign: "left",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: isLive ? 1 : 0.4,
            }}
            onMouseEnter={(e) => {
              if (!isActive && isLive)
                (e.currentTarget as HTMLButtonElement).style.background = "#1e2124";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLButtonElement).style.background = isActive
                  ? "#222628"
                  : "transparent";
            }}
          >
            <span
              style={{
                fontSize: 18,
                width: 26,
                textAlign: "center",
                color: isActive ? d.color : "#888C8E",
                transition: "color 0.15s",
              }}
            >
              {d.icon}
            </span>
            <div>
              <div
                style={{
                  color: isActive ? "#E6E4DF" : "#888C8E",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  transition: "color 0.15s",
                  letterSpacing: "0.01em",
                }}
              >
                {d.label}
              </div>
              <div style={{ color: "#888C8E", fontSize: 10, marginTop: 1 }}>
                {isLive ? d.subtitle : "Coming soon"}
              </div>
            </div>
          </button>
        );
      })}

      <div
        style={{
          marginTop: "auto",
          padding: "20px 20px 0",
          borderTop: "1px solid #2C3133",
        }}
      >
        <div style={{ color: "#888C8E", fontSize: 10, lineHeight: 1.6 }}>
          Paste an edge list, type a formula, or upload a NetworkX JSON file.
        </div>
      </div>
    </aside>
  );
}
