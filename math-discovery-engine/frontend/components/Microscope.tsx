"use client";

import React from "react";
import { Domain } from "@/types/domain";
import {
  MathResponse,
  KnotResponse,
  ManifoldResponse,
  CircuitResponse,
  AlgebraicResponse,
  BatchDataPoint,
  TDAResponse,
  WLResponse,
} from "@/lib/api";
import { ViewMode } from "@/components/GraphVisualizer";
import {
  EmptyMicroscope,
  ResultView,
  AlgebraicResultView,
  CircuitResultView,
  ManifoldResultView,
  KnotResultView,
  TDAResultView,
  WLResultView,
} from "@/components/results";
import BatchVisualizer from "@/components/BatchVisualizer";

export interface MicroscopeProps {
  result: MathResponse | null;
  knotResult: KnotResponse | null;
  manifoldResult: ManifoldResponse | null;
  circuitResult: CircuitResponse | null;
  algebraicResult: AlgebraicResponse | null;
  batchData: BatchDataPoint[] | null;
  tdaResult: TDAResponse | null;
  wlResult: WLResponse | null;
  wlStep: number;
  setWlStep: (s: number) => void;
  conjectures: string[] | null;
  domain: Domain;
  error: string | null;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  onEdgeRemove?: (source: string | number, target: string | number) => void;
  onNodeRemove?: (nodeId: string | number) => void;
  perturbationCount?: number;
  deletedEdges?: (string | number)[][];
}

export function Microscope({
  result,
  knotResult,
  manifoldResult,
  circuitResult,
  algebraicResult,
  batchData,
  tdaResult,
  wlResult,
  wlStep,
  setWlStep,
  conjectures,
  domain,
  error,
  viewMode,
  setViewMode,
  onEdgeRemove,
  onNodeRemove,
  perturbationCount,
  deletedEdges,
}: MicroscopeProps) {
  const isKnotDomain = domain.id === "knot";
  const isTopooDomain = domain.id === "topology";
  const isCircuitDomain = domain.id === "circuit";
  const isAlgebraicDomain = domain.id === "algebraic-geometry";
  const isBatchDomain = domain.id === "batch-explorer";
  const isTDADomain = domain.id === "tda";
  const isWLDomain = domain.id === "wl_test";
  const hasResult = !!(
    result ||
    knotResult ||
    manifoldResult ||
    circuitResult ||
    algebraicResult ||
    batchData ||
    tdaResult ||
    wlResult
  );

  return (
    <div
      style={{
        background: "#111315",
        border: "1px solid #2C3133",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 400,
      }}
    >
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid #2C3133",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: domain.color, fontSize: 14 }}>◉</span>
          <span
            style={{
              color: "#E6E4DF",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            {isBatchDomain
              ? "BATCH ANALYSIS"
              : isWLDomain
              ? "TWIN TEST RESULTS"
              : "STRUCTURE MICROSCOPE"}
          </span>
        </div>
        {result &&
          !isKnotDomain &&
          !isTopooDomain &&
          !isCircuitDomain &&
          !isAlgebraicDomain &&
          !isBatchDomain &&
          !isTDADomain &&
          !isWLDomain && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  background: "#6B807520",
                  border: "1px solid #6B8075",
                  color: "#6B8075",
                  borderRadius: 6,
                  padding: "2px 10px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                }}
              >
                {result.metadata.num_nodes}V · {result.metadata.num_edges}E
              </span>
              {perturbationCount !== undefined && perturbationCount > 0 && (
                <span
                  title={`${perturbationCount} edge${
                    perturbationCount === 1 ? "" : "s"
                  } removed by interactive perturbation`}
                  style={{
                    background: "#C0564020",
                    border: "1px solid #C05640",
                    color: "#C05640",
                    borderRadius: 6,
                    padding: "2px 10px",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    animation: "pulse 1.8s ease-in-out 1",
                  }}
                >
                  −{perturbationCount}E perturbed
                </span>
              )}
            </div>
          )}
        {knotResult && isKnotDomain && (
          <span
            style={{
              background: `${domain.color}20`,
              border: `1px solid ${domain.color}`,
              color: domain.color,
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            Torus Knot · {knotResult.nodes.length} pts
          </span>
        )}
        {manifoldResult && isTopooDomain && (
          <span
            style={{
              background: `${domain.color}20`,
              border: `1px solid ${domain.color}`,
              color: domain.color,
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            {manifoldResult.nodes.length}V · χ ={" "}
            {manifoldResult.invariants.euler_characteristic}
          </span>
        )}
        {circuitResult && isCircuitDomain && (
          <span
            style={{
              background: `${domain.color}20`,
              border: `1px solid ${domain.color}`,
              color: domain.color,
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            Depth {circuitResult.invariants.depth} · {circuitResult.invariants.num_gates} gates
          </span>
        )}
        {algebraicResult && isAlgebraicDomain && (
          <span
            style={{
              background: `${domain.color}20`,
              border: `1px solid ${domain.color}`,
              color: domain.color,
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            {algebraicResult.invariants.num_vertices.toLocaleString()}V ·{" "}
            {algebraicResult.invariants.num_faces.toLocaleString()}F
          </span>
        )}
        {batchData && isBatchDomain && (
          <span
            style={{
              background: `${domain.color}20`,
              border: `1px solid ${domain.color}`,
              color: domain.color,
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            Samples: {batchData.length}
          </span>
        )}
        {tdaResult && isTDADomain && (
          <span
            style={{
              background: `${domain.color}20`,
              border: `1px solid ${domain.color}`,
              color: domain.color,
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            TDA · {tdaResult.nodes.length} pts · H₁: {tdaResult.barcodes?.H1?.length ?? 0} loops
          </span>
        )}
        {wlResult && isWLDomain && (
          <span
            style={{
              background: `${domain.color}20`,
              border: `1px solid ${domain.color}`,
              color: domain.color,
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            Twin Test
          </span>
        )}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: error || !hasResult ? "center" : "flex-start",
          justifyContent: error || !hasResult ? "center" : "flex-start",
          padding: 24,
          overflowY: "auto",
        }}
      >
        {error ? (
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
            <div
              style={{
                color: "#C05640",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Parse / Computation Error
            </div>
            <div
              style={{
                color: "#888C8E",
                fontSize: 12,
                lineHeight: 1.7,
                background: "#1C1F21",
                border: "1px solid #C0564030",
                borderRadius: 8,
                padding: "12px 16px",
                fontFamily: "'Courier New', monospace",
                textAlign: "left",
              }}
            >
              {error}
            </div>
          </div>
        ) : isTopooDomain ? (
          manifoldResult ? (
            <ManifoldResultView
              manifoldResult={manifoldResult}
              domain={domain}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onNodeRemove={onNodeRemove}
            />
          ) : (
            <EmptyMicroscope domain={domain} />
          )
        ) : isKnotDomain ? (
          knotResult ? (
            <KnotResultView
              knotResult={knotResult}
              domain={domain}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : (
            <EmptyMicroscope domain={domain} />
          )
        ) : isCircuitDomain ? (
          circuitResult ? (
            <CircuitResultView
              circuitResult={circuitResult}
              domain={domain}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : (
            <EmptyMicroscope domain={domain} />
          )
        ) : isAlgebraicDomain ? (
          algebraicResult ? (
            <AlgebraicResultView
              algebraicResult={algebraicResult}
              domain={domain}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : (
            <EmptyMicroscope domain={domain} />
          )
        ) : isBatchDomain ? (
          batchData ? (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Conjectures card — rendered when Oracle has run */}
              {conjectures && conjectures.length > 0 && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #D19E4A08, #D19E4A04)",
                    border: "1px solid #D19E4A55",
                    borderRadius: 12,
                    padding: "20px 24px",
                    boxShadow: "0 0 40px #D19E4A18, inset 0 1px 0 #D19E4A22",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🔮</span>
                    <span
                      style={{
                        color: "#D19E4A",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      Discovered Theorems
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: "linear-gradient(to right, #D19E4A44, transparent)",
                      }}
                    />
                    <span style={{ color: "#D19E4A66", fontSize: 9, letterSpacing: "0.08em" }}>
                      SVD · Null Space Analysis
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {conjectures.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#D19E4A0A",
                          border: "1px solid #D19E4A33",
                          borderRadius: 8,
                          padding: "14px 18px",
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        <span
                          style={{
                            color: "#D19E4A55",
                            fontSize: 10,
                            fontWeight: 700,
                            fontFamily: "'Courier New', monospace",
                            flexShrink: 0,
                          }}
                        >
                          Thm {(i + 1).toString().padStart(2, "0")}
                        </span>
                        <span
                          style={{
                            color: "#E6E4DF",
                            fontFamily: "'Courier New', monospace",
                            fontSize: 15,
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            wordBreak: "break-all",
                          }}
                        >
                          {c}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: 14,
                      color: "#888C8E55",
                      fontSize: 9,
                      letterSpacing: "0.06em",
                      textAlign: "right",
                    }}
                  >
                    Derived from {batchData.length} graph samples via Singular Value Decomposition
                  </div>
                </div>
              )}
              <BatchVisualizer data={batchData} />
            </div>
          ) : (
            <EmptyMicroscope domain={domain} />
          )
        ) : isTDADomain ? (
          tdaResult ? (
            <TDAResultView tdaResult={tdaResult} domain={domain} />
          ) : (
            <EmptyMicroscope domain={domain} />
          )
        ) : isWLDomain ? (
          wlResult ? (
            <WLResultView wlResult={wlResult} wlStep={wlStep} setWlStep={setWlStep} />
          ) : (
            <EmptyMicroscope domain={domain} />
          )
        ) : result ? (
          <ResultView
            result={result}
            domain={domain}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onEdgeRemove={onEdgeRemove}
            deletedEdges={deletedEdges}
          />
        ) : (
          <EmptyMicroscope domain={domain} />
        )}
      </div>
    </div>
  );
}
export default Microscope;
