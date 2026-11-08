"use client";

import React, { useState, useCallback } from "react";
import { Download } from "lucide-react";
import { Domain } from "@/types/domain";
import { MathRequest, exportToPython, listSessions, createSession, saveExploration, SessionItem } from "@/lib/api";

export interface RightPanelProps {
  domain: Domain;
  params: Record<string, number>;
  setParams: (p: Record<string, number>) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  history: { id: string; type: "genesis" | "cut"; detail: string }[];
  currentEdges: (string | number)[][];
  currentResult?: unknown;
  rawInput?: string;
}

export function RightPanel({
  domain,
  params,
  setParams,
  isOpen,
  setIsOpen,
  history,
  currentEdges,
  currentResult,
  rawInput,
}: RightPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load sessions from SQLite on mount
  React.useEffect(() => {
    listSessions().then((res) => {
      setSessions(res);
      if (res.length > 0 && !activeSessionId) {
        setActiveSessionId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return;
    try {
      const created = await createSession(newSessionTitle.trim());
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      setNewSessionTitle("");
    } catch (err) {
      console.error("Create session error:", err);
    }
  };

  const handleSaveExploration = async () => {
    if (!activeSessionId && sessions.length === 0) {
      const created = await createSession("Laboratory Session");
      setSessions([created]);
      setActiveSessionId(created.id);
    }
    const sessId = activeSessionId || (sessions[0]?.id ?? "default");
    setIsSaving(true);
    try {
      const dataToSave = currentResult || { edges: currentEdges };
      await saveExploration(
        sessId,
        domain.id,
        "edge_list",
        rawInput || currentEdges.map(([u, v]) => `${u} ${v}`).join("\n") || "empty",
        dataToSave
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      // Refresh sessions to update count
      const updated = await listSessions();
      setSessions(updated);
    } catch (err) {
      console.error("Save exploration error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = useCallback(async () => {
    if (currentEdges.length === 0) return;
    setIsExporting(true);
    try {
      const rawData = currentEdges.map(([u, v]) => `${u} ${v}`).join("\n");
      const request: MathRequest = { input_type: "edge_list", raw_data: rawData };
      await exportToPython(request);
    } catch (err) {
      console.error("[Export] Failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [currentEdges]);

  const sliders = [
    {
      key: "max_filtration_radius",
      label: "Max Filtration Radius",
      min: 0.1,
      max: 5,
      step: 0.1,
      description: "Controls the Cech/Vietoris-Rips complex scale",
    },
    {
      key: "gnn_layers",
      label: "GNN Layers",
      min: 1,
      max: 10,
      step: 1,
      description: "Depth of the graph neural network",
    },
    {
      key: "persistence_threshold",
      label: "Persistence Threshold",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Minimum lifetime for topological features",
    },
    {
      key: "homology_degree",
      label: "Homology Degree",
      min: 0,
      max: 3,
      step: 1,
      description: "Maximum Betti number dimension to compute",
    },
  ];
  const defaultVal = (key: string) =>
    key === "max_filtration_radius"
      ? 1.5
      : key === "gnn_layers"
      ? 3
      : key === "persistence_threshold"
      ? 0.1
      : 1;

  return (
    <div
      style={{
        width: isOpen ? 280 : 44,
        minWidth: isOpen ? 280 : 44,
        flexShrink: 0,
        background: "#1C1F21",
        borderLeft: "1px solid #2C3133",
        transition: "width 0.25s ease, min-width 0.25s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        id="params-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Collapse" : "Expand advanced parameters"}
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "1px solid #2C3133",
          color: "#888C8E",
          cursor: "pointer",
          padding: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: isOpen ? "space-between" : "center",
          gap: 8,
          transition: "color 0.15s",
          whiteSpace: "nowrap",
          overflow: "hidden",
          minHeight: 48,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#E6E4DF";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#888C8E";
        }}
      >
        {isOpen && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#888C8E",
              textTransform: "uppercase",
            }}
          >
            Advanced Parameters
          </span>
        )}
        <span
          style={{
            fontSize: 16,
            transform: isOpen ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.25s",
          }}
        >
          ⟩
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            overflowY: "auto",
          }}
        >
          {/* ── Perturbation Ledger ──────────────────────────────────────── */}
          {history.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    color: "#888C8E",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  ⊕ Perturbation Ledger
                </span>
                <button
                  id="export-python-btn"
                  onClick={handleExport}
                  disabled={isExporting || currentEdges.length === 0}
                  title="Export current graph state to a Python script"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "transparent",
                    border: "1px solid #2C3133",
                    borderRadius: 6,
                    color: isExporting ? "#444" : "#888C8E",
                    cursor:
                      isExporting || currentEdges.length === 0
                        ? "not-allowed"
                        : "pointer",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    padding: "4px 8px",
                    textTransform: "uppercase",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isExporting && currentEdges.length > 0) {
                      (e.currentTarget as HTMLButtonElement).style.color = "#E6E4DF";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "#6B8075";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#888C8E";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#2C3133";
                  }}
                >
                  <Download size={9} strokeWidth={2.5} />
                  {isExporting ? "Exporting…" : ".py"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {history.map((entry, i) => {
                  const isGenesis = entry.type === "genesis";
                  const color = isGenesis ? "#6B8075" : "#C05640";
                  const isLast = i === history.length - 1;
                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color,
                            flexShrink: 0,
                            boxShadow: `0 0 6px ${color}88`,
                            marginTop: 2,
                          }}
                        />
                        {!isLast && (
                          <div
                            style={{
                              width: 1,
                              flex: 1,
                              background: "#2C3133",
                              minHeight: 18,
                              marginTop: 2,
                            }}
                          />
                        )}
                      </div>
                      <div style={{ paddingBottom: isLast ? 0 : 14 }}>
                        <div
                          style={{
                            color,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            lineHeight: 1,
                          }}
                        >
                          {isGenesis ? "GENESIS" : "CUT"}
                        </div>
                        <div
                          style={{
                            color: "#888C8E",
                            fontSize: 9,
                            marginTop: 3,
                            lineHeight: 1.5,
                            fontFamily: "'Courier New', monospace",
                          }}
                        >
                          {entry.detail}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Advanced parameter sliders ────────────────────────────────── */}
          <div>
            <div
              style={{
                color: "#888C8E",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              ⊙ Advanced Parameters
            </div>
            {sliders.map((s) => (
              <div key={s.key} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      color: "#E6E4DF",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      color: domain.color,
                      fontSize: 11,
                      fontFamily: "'Courier New', monospace",
                      fontWeight: 700,
                    }}
                  >
                    {params[s.key] ?? defaultVal(s.key)}
                  </span>
                </div>
                <input
                  id={`param-${s.key}`}
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={params[s.key] ?? defaultVal(s.key)}
                  onChange={(e) =>
                    setParams({ ...params, [s.key]: parseFloat(e.target.value) })
                  }
                  style={{ width: "100%", accentColor: domain.color, cursor: "pointer" }}
                />
                <div style={{ color: "#888C8E", fontSize: 9, marginTop: 4, lineHeight: 1.5 }}>
                  {s.description}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: "12px",
              background: "#141617",
              borderRadius: 8,
              border: "1px solid #2C3133",
            }}
          >
            <div style={{ color: "#888C8E", fontSize: 9, lineHeight: 1.7 }}>
              <span style={{ color: domain.color, fontWeight: 600 }}>Professor mode</span>
              <br />
              These parameters will tune the persistent homology pipeline and GNN architecture in
              Step 3.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default RightPanel;
