"use client";

import React, { useState, useEffect } from "react";
import { processNarrator, NarratorResponse } from "@/lib/api";

interface ProfessorNotesProps {
  domain: string;
  invariants: Record<string, unknown>;
  formula?: string;
}

export function ProfessorNotes({ domain, invariants, formula }: ProfessorNotesProps) {
  const [data, setData] = useState<NarratorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await processNarrator({
        domain,
        invariants,
        formula: formula ?? "",
      });
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load commentary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, JSON.stringify(invariants), formula]);

  const copyToClipboard = () => {
    if (!data) return;
    const text = [
      `PROFESSOR'S NOTES: ${domain.toUpperCase()}`,
      `==================================`,
      `SYNOPSIS:\n${data.summary}\n`,
      `KEY MATHEMATICAL INSIGHTS:`,
      ...data.key_insights.map((k) => `• ${k}`),
      `\nTHEORETICAL CONNECTIONS:`,
      ...data.theoretical_connections.map((t) => `• ${t}`),
      `\nOPEN RESEARCH QUESTIONS:`,
      ...data.open_questions.map((q) => `? ${q}`),
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: "#1C1F21",
        border: "1px solid #D19E4A50",
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        marginTop: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #2C3133",
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🎓</span>
          <div>
            <div
              style={{
                color: "#D19E4A",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Professor&apos;s Notes · Mathematical Commentary
            </div>
            <div style={{ color: "#888C8E", fontSize: 10, marginTop: 2 }}>
              Automated analytical deconstruction of invariant spectra & topological obstructions
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={fetchNotes}
            disabled={loading}
            style={{
              background: "#2C3133",
              border: "1px solid #2C3133",
              borderRadius: 6,
              color: "#E6E4DF",
              fontSize: 10,
              fontWeight: 700,
              padding: "4px 10px",
              cursor: loading ? "wait" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "ANALYZING..." : "↻ RE-ANALYZE"}
          </button>
          {data && (
            <button
              onClick={copyToClipboard}
              style={{
                background: copied ? "#6B8075" : "#2C313380",
                border: "1px solid #2C3133",
                borderRadius: 6,
                color: copied ? "#141617" : "#E6E4DF",
                fontSize: 10,
                fontWeight: 700,
                padding: "4px 10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {copied ? "✓ COPIED" : "📋 COPY NOTES"}
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: "transparent",
              border: "none",
              color: "#888C8E",
              fontSize: 14,
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            {isCollapsed ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {loading && !data && (
        <div style={{ color: "#888C8E", fontSize: 12, padding: "12px 0", fontStyle: "italic" }}>
          Deconstructing simplicial homology, spectral bounds, and algebraic invariants...
        </div>
      )}

      {error && (
        <div style={{ color: "#C05640", fontSize: 12, padding: "8px 0" }}>
          Error: {error}
        </div>
      )}

      {!isCollapsed && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Executive Synopsis */}
          <div
            style={{
              background: "#16191B",
              borderLeft: "3px solid #D19E4A",
              borderRadius: "0 8px 8px 0",
              padding: "12px 16px",
              fontSize: 13,
              fontFamily: "'Georgia', serif",
              lineHeight: 1.6,
              color: "#E6E4DF",
            }}
          >
            {data.summary}
          </div>

          {/* Key Insights */}
          <div>
            <div
              style={{
                color: "#6B8075",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Key Mathematical Observations
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.key_insights.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0F1113",
                    border: "1px solid #2C3133",
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "#E6E4DF",
                    lineHeight: 1.5,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "#C05640", fontWeight: 700 }}>▸</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Theoretical Connections */}
          <div>
            <div
              style={{
                color: "#D19E4A",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Governing Mathematical Frameworks
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.theoretical_connections.map((theorem, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0F1113",
                    border: "1px solid #2C3133",
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 11,
                    fontFamily: "'Courier New', monospace",
                    color: "#D19E4A",
                    lineHeight: 1.4,
                  }}
                >
                  📜 {theorem}
                </div>
              ))}
            </div>
          </div>

          {/* Open Questions */}
          <div>
            <div
              style={{
                color: "#888C8E",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Socratic Inquiries for Discovery
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.open_questions.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    color: "#888C8E",
                    fontSize: 11,
                    fontStyle: "italic",
                    paddingLeft: 6,
                    lineHeight: 1.4,
                  }}
                >
                  • {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
