"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  processObject,
  processKnot,
  processManifold,
  processCircuit,
  processAlgebraic,
  processBatch,
  processTDA,
  processWL,
  processOracle,
  OracleResponse,
  ApiError,
  type InputType,
  type MathResponse,
  type KnotResponse,
  type ManifoldResponse,
  type CircuitResponse,
  type AlgebraicResponse,
  type BatchDataPoint,
  type TDAResponse,
  type WLResponse,
  type ManifoldRequest,
} from "@/lib/api";
import { Domain, DOMAINS, InputMode } from "@/types/domain";
import { Sidebar } from "@/components/Sidebar";
import { Microscope } from "@/components/Microscope";
import { RightPanel } from "@/components/RightPanel";
import {
  Dropzone,
  AlgebraicDropzone,
  CircuitDropzone,
  KnotDropzone,
  TDADropzone,
  WLDropzone,
  ManifoldDropzone,
} from "@/components/dropzones";
import { ViewMode } from "@/components/GraphVisualizer";

export default function HomePage() {
  const [selectedDomain, setSelectedDomain] = useState<Domain>(DOMAINS[1]);
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [pastedText, setPastedText] = useState("");
  const [formulaText, setFormulaText] = useState("K_5");
  const [knotFormula, setKnotFormula] = useState("T_3_2");
  const [manifoldShape, setManifoldShape] = useState<"Sphere" | "Torus" | "Custom">("Sphere");
  const [deformation, setDeformation] = useState<"none" | "stretch" | "ripple">("none");
  const [exprX, setExprX] = useState("(2 + v*cos(u/2))*cos(u)");
  const [exprY, setExprY] = useState("(2 + v*cos(u/2))*sin(u)");
  const [exprZ, setExprZ] = useState("v*sin(u/2)");
  const [uMin, setUMin] = useState("0");
  const [uMax, setUMax] = useState("6.283");
  const [vMin, setVMin] = useState("-1");
  const [vMax, setVMax] = useState("1");
  const [fileContent, setFileContent] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MathResponse | null>(null);
  const [knotResult, setKnotResult] = useState<KnotResponse | null>(null);
  const [manifoldResult, setManifoldResult] = useState<ManifoldResponse | null>(null);
  const [circuitResult, setCircuitResult] = useState<CircuitResponse | null>(null);
  const [algebraicResult, setAlgebraicResult] = useState<AlgebraicResponse | null>(null);
  const [circuitFormula, setCircuitFormula] = useState("(x1 & x2) | (~x3 & x4)");
  const [algebraicFormula, setAlgebraicFormula] = useState("x**2 + y**2 - z**2");
  const [error, setError] = useState<string | null>(null);
  const [paramsOpen, setParamsOpen] = useState(false);
  const [params, setParams] = useState<Record<string, number>>({
    max_filtration_radius: 1.5,
    gnn_layers: 3,
    persistence_threshold: 0.1,
    homology_degree: 1,
  });
  const [viewMode, setViewMode] = useState<ViewMode>("spectral");
  // currentEdges tracks the live edge list after any user perturbations.
  const [currentEdges, setCurrentEdges] = useState<(string | number)[][]>([]);
  const [perturbationCount, setPerturbationCount] = useState(0);
  // deletedEdges: kept in 3D as ghost strands, removed from maths.
  const [deletedEdges, setDeletedEdges] = useState<(string | number)[][]>([]);
  // deletedManifoldNodes: node IDs excised from the current manifold mesh.
  const [deletedManifoldNodes, setDeletedManifoldNodes] = useState<number[]>([]);
  // history: the Laboratory Ledger timeline.
  const [history, setHistory] = useState<{ id: string; type: "genesis" | "cut"; detail: string }[]>([]);
  // batchData: results from the Batch Dataset Explorer.
  const [batchData, setBatchData] = useState<BatchDataPoint[] | null>(null);
  const [batchSamples, setBatchSamples] = useState(100);
  // Oracle: discovered conjectures from SVD null-space analysis.
  const [conjectures, setConjectures] = useState<string[] | null>(null);
  const [oracleResult, setOracleResult] = useState<OracleResponse | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  // tdaResult: results from the Topological Data Analysis (Persistent Homology) engine.
  const [tdaResult, setTDAResult] = useState<TDAResponse | null>(null);
  const [tdaShape, setTdaShape] = useState<"noisy_circle" | "noisy_sphere" | "random_noise">("noisy_circle");
  const [tdaNumPoints, setTdaNumPoints] = useState(150);
  const [tdaNoiseLevel, setTdaNoiseLevel] = useState(0.15);
  // wlResult: results from the Weisfeiler-Lehman Graph Isomorphism test.
  const [wlResult, setWLResult] = useState<WLResponse | null>(null);
  const [wlFormula1, setWLFormula1] = useState("C_6");
  const [wlFormula2, setWLFormula2] = useState("0 1\n1 2\n2 3\n3 4\n4 5\n5 0");
  const [wlStep, setWlStep] = useState(0);

  const activeDomain = selectedDomain.id;
  const isKnotDomain = activeDomain === "knot";
  const isTopologyDomain = activeDomain === "topology";
  const isCircuitDomain = activeDomain === "circuit";
  const isAlgebraicDomain = activeDomain === "algebraic-geometry";
  const isBatchDomain = activeDomain === "batch-explorer";
  const isTDADomain = activeDomain === "tda";
  const isWLDomain = activeDomain === "wl_test";

  // Clear results when switching domain
  const handleDomainSelect = useCallback((d: Domain) => {
    setSelectedDomain(d);
    setResult(null);
    setKnotResult(null);
    setManifoldResult(null);
    setCircuitResult(null);
    setAlgebraicResult(null);
    setBatchData(null);
    setTDAResult(null);
    setWLResult(null);
    setError(null);
    setHistory([]);
    setDeletedEdges([]);
    setCurrentEdges([]);
    setPerturbationCount(0);
  }, []);

  useEffect(() => {
    setResult(null);
    setKnotResult(null);
    setManifoldResult(null);
    setCircuitResult(null);
    setAlgebraicResult(null);
    setBatchData(null);
    setTDAResult(null);
    setWLResult(null);
    setError(null);
  }, [selectedDomain]);

  const handleFileLoad = useCallback((raw: string) => {
    setFileContent(raw);
    setInputMode("upload");
  }, []);

  const handleDiscover = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setKnotResult(null);
    setManifoldResult(null);
    setCircuitResult(null);
    setAlgebraicResult(null);
    setTDAResult(null);
    setWLResult(null);

    // ── Topology domain (Surfaces & Manifolds) ────────────────────────────────
    if (isTopologyDomain) {
      setDeletedManifoldNodes([]);
      try {
        const req: ManifoldRequest = {
          shape: manifoldShape,
          resolution: 15,
          deformation,
          ...(manifoldShape === "Custom" && {
            expr_x: exprX,
            expr_y: exprY,
            expr_z: exprZ,
            u_min: parseFloat(uMin) || 0,
            u_max: parseFloat(uMax) || 6.283,
            v_min: parseFloat(vMin) || 0,
            v_max: parseFloat(vMax) || 6.283,
          }),
        };
        const response = await processManifold(req);
        setManifoldResult(response);
        setHistory([{ id: Date.now().toString(), type: "genesis", detail: `Origin: ${manifoldShape}` }]);
      } catch (err) {
        let msg: string;
        if (err instanceof ApiError) msg = err.detail;
        else if (err instanceof Error) msg = err.message;
        else msg = String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Complexity Theory (Boolean Circuits) ───────────────────────────────
    if (isCircuitDomain) {
      const trimmed = circuitFormula.trim();
      if (!trimmed) {
        setError("Formula is empty. Try: (x1 & x2) | (~x3 & x4)");
        setIsLoading(false);
        return;
      }
      try {
        const response = await processCircuit({ formula: trimmed });
        setCircuitResult(response);
        setHistory([{ id: Date.now().toString(), type: "genesis", detail: `Circuit: ${trimmed.slice(0, 40)}` }]);
      } catch (err) {
        let msg: string;
        if (err instanceof ApiError) msg = err.detail;
        else if (err instanceof Error) msg = err.message;
        else msg = String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Algebraic Geometry (Implicit Varieties) ───────────────────────────
    if (isAlgebraicDomain) {
      const trimmed = algebraicFormula.trim();
      if (!trimmed) {
        setError("Formula is empty. Try: x**2 + y**2 - z**2");
        setIsLoading(false);
        return;
      }
      try {
        const response = await processAlgebraic({ formula: trimmed });
        setAlgebraicResult(response);
        setHistory([{ id: Date.now().toString(), type: "genesis", detail: `Variety: F(x,y,z) = ${trimmed.slice(0, 40)}` }]);
      } catch (err) {
        let msg: string;
        if (err instanceof ApiError) msg = err.detail;
        else if (err instanceof Error) msg = err.message;
        else msg = String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Knot Theory domain ─────────────────────────────────────────────────
    if (isKnotDomain) {
      const trimmed = knotFormula.trim();
      if (!trimmed) {
        setError("Knot formula is empty. Try T_3_2 for a Trefoil.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await processKnot({ formula: trimmed });
        setKnotResult(response);
      } catch (err) {
        let msg: string;
        if (err instanceof ApiError) msg = err.detail;
        else if (err instanceof Error) msg = err.message;
        else msg = String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Topological Data Analysis (Persistent Homology) ───────────────────
    if (isTDADomain) {
      try {
        const response = await processTDA({
          shape: tdaShape,
          num_points: tdaNumPoints,
          noise_level: tdaNoiseLevel,
        });
        setTDAResult(response);
        setHistory([{
          id: Date.now().toString(),
          type: "genesis",
          detail: `TDA: ${tdaShape} (${tdaNumPoints} pts, σ=${tdaNoiseLevel})`,
        }]);
      } catch (err) {
        let msg: string;
        if (err instanceof ApiError) msg = err.detail;
        else if (err instanceof Error) msg = err.message;
        else msg = String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Weisfeiler-Lehman Graph Isomorphism ──────────────────────────────────
    if (isWLDomain) {
      try {
        const response = await processWL({
          formula1: wlFormula1,
          formula2: wlFormula2,
        });
        setWLResult(response);
        setWlStep(0);
        setHistory([{
          id: Date.now().toString(),
          type: "genesis",
          detail: `Twin Test: Graph A vs Graph B`,
        }]);
      } catch (err) {
        let msg: string;
        if (err instanceof ApiError) msg = err.detail;
        else if (err instanceof Error) msg = err.message;
        else msg = String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Combinatorics / other graph domains ────────────────────────────────
    try {
      let inputType: InputType;
      let rawData: string;
      if (inputMode === "upload") {
        if (!fileContent.trim()) throw new Error("No file loaded. Drop or select a JSON file first.");
        inputType = "json";
        rawData = fileContent;
      } else if (inputMode === "paste") {
        if (!pastedText.trim()) {
          inputType = selectedDomain.defaultInputType;
          rawData = selectedDomain.defaultRawData;
        } else {
          inputType = "edge_list";
          rawData = pastedText;
        }
      } else {
        const trimmed = formulaText.trim();
        if (!trimmed) throw new Error("Formula is empty. Enter a formula such as K_5, C_6, or P_4.");
        inputType = "formula";
        rawData = trimmed;
      }
      const response = await processObject(inputType, rawData);
      setResult(response);
      setCurrentEdges(response.edges);
      setDeletedEdges([]);
      setPerturbationCount(0);
      setHistory([{ id: "genesis", type: "genesis", detail: `Origin: ${rawData.slice(0, 40).replace(/\n/g, " · ")}` }]);
    } catch (err) {
      let msg: string;
      if (err instanceof ApiError) {
        msg = err.detail;
      } else if (err instanceof Error) {
        msg = err.message;
      } else {
        msg = String(err);
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [
    isTopologyDomain,
    manifoldShape,
    deformation,
    exprX,
    exprY,
    exprZ,
    uMin,
    uMax,
    vMin,
    vMax,
    isKnotDomain,
    knotFormula,
    isCircuitDomain,
    circuitFormula,
    isAlgebraicDomain,
    algebraicFormula,
    isTDADomain,
    tdaShape,
    tdaNumPoints,
    tdaNoiseLevel,
    isWLDomain,
    wlFormula1,
    wlFormula2,
    selectedDomain,
    inputMode,
    pastedText,
    formulaText,
    fileContent,
  ]);

  /** handleBatchGenerate — called by the Batch Explorer "generate" button. */
  const handleBatchGenerate = useCallback(async (n: number) => {
    setIsLoading(true);
    setError(null);
    setBatchData(null);
    setConjectures(null);
    setOracleResult(null);
    try {
      const response = await processBatch({ num_samples: n });
      setBatchData(response.data);
      setHistory([{ id: Date.now().toString(), type: "genesis", detail: `Batch: ${n} random graphs` }]);
    } catch (err) {
      let msg: string;
      if (err instanceof ApiError) msg = err.detail;
      else if (err instanceof Error) msg = err.message;
      else msg = String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** handleOracle — sends batch data to the SVD Conjecture Oracle. */
  const handleOracle = useCallback(async () => {
    if (!batchData || batchData.length === 0) return;
    setIsThinking(true);
    setConjectures(null);
    setOracleResult(null);
    try {
      const response = await processOracle({ batch_data: batchData as unknown as Record<string, number>[] });
      setConjectures(response.conjectures);
    } catch (err) {
      let msg: string;
      if (err instanceof ApiError) msg = err.detail;
      else if (err instanceof Error) msg = err.message;
      else msg = String(err);
      setError(msg);
    } finally {
      setIsThinking(false);
    }
  }, [batchData]);

  /**
   * handleEdgeRemove — called by GraphVisualizer when the user clicks an edge.
   * Filters out the clicked edge from currentEdges, serialises the remainder
   * as an edge_list string, and silently re-submits to the backend for a full
   * topology + AI saliency recalculation.
   */
  const handleEdgeRemove = useCallback(
    async (source: string | number, target: string | number) => {
      const src = String(source);
      const tgt = String(target);

      const nextEdges = currentEdges.filter(([u, v]) => {
        const us = String(u);
        const vs = String(v);
        return !((us === src && vs === tgt) || (us === tgt && vs === src));
      });

      if (nextEdges.length === 0) return; // refuse empty graph

      setDeletedEdges((prev) => [...prev, [src, tgt]]);
      setCurrentEdges(nextEdges);
      setPerturbationCount((c) => c + 1);
      setHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), type: "cut", detail: `Cut (${src}, ${tgt})` },
      ]);

      const rawData = nextEdges.map(([u, v]) => `${u} ${v}`).join("\n");

      setIsLoading(true);
      setError(null);
      try {
        const response = await processObject("edge_list", rawData);
        setResult(response);
        setCurrentEdges(response.edges);
      } catch (err) {
        let msg: string;
        if (err instanceof ApiError) msg = err.detail;
        else if (err instanceof Error) msg = err.message;
        else msg = String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [currentEdges]
  );

  /**
   * handleManifoldNodeRemove — called by GraphVisualizer when user clicks a manifold node.
   * Adds the nodeId to deletedManifoldNodes, records a surgery entry in the Ledger,
   * and silently re-submits the manifold to the backend for Cotangent Laplacian recomputation.
   */
  const handleManifoldNodeRemove = useCallback(
    async (nodeId: string | number) => {
      const id = Number(nodeId);
      if (isNaN(id)) return;

      const nextDeleted = [...deletedManifoldNodes, id];
      setDeletedManifoldNodes(nextDeleted);
      setHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), type: "cut", detail: `🔪 Surgery: Node ${id} excised` },
      ]);

      setIsLoading(true);
      setError(null);
      try {
        const req: ManifoldRequest = {
          shape: manifoldShape,
          resolution: 15,
          deformation,
          deleted_nodes: nextDeleted,
          ...(manifoldShape === "Custom" && {
            expr_x: exprX,
            expr_y: exprY,
            expr_z: exprZ,
            u_min: parseFloat(uMin) || 0,
            u_max: parseFloat(uMax) || 6.283,
            v_min: parseFloat(vMin) || 0,
            v_max: parseFloat(vMax) || 6.283,
          }),
        };
        const response = await processManifold(req);
        setManifoldResult(response);
      } catch (err) {
        let msg: string;
        if (err instanceof ApiError) msg = err.detail;
        else if (err instanceof Error) msg = err.message;
        else msg = String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [deletedManifoldNodes, manifoldShape, deformation, exprX, exprY, exprZ, uMin, uMax, vMin, vMax]
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #141617; color: #E6E4DF; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #141617; }
        ::-webkit-scrollbar-thumb { background: #2C3133; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #888C8E; }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.25; } 50% { transform: scale(1.08); opacity: 0.55; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Top bar */}
        <header
          style={{
            background: "#1C1F21",
            borderBottom: "1px solid #2C3133",
            padding: "0 24px",
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#E6E4DF", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em" }}>
              Visual Mathematical Discovery Engine
            </span>
            <span
              style={{
                background: "#2C3133",
                color: "#888C8E",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.1em",
                padding: "2px 8px",
                borderRadius: 4,
                textTransform: "uppercase",
              }}
            >
              Step 2 · Data Ingestion
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ color: "#888C8E", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6B8075", display: "inline-block" }} />
              Backend · localhost:8000
            </span>
            <span style={{ color: "#888C8E", fontSize: 11 }}>
              Domain: <span style={{ color: selectedDomain.color, fontWeight: 600 }}>{selectedDomain.label}</span>
            </span>
          </div>
        </header>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <Sidebar selected={selectedDomain} onSelect={handleDomainSelect} />

          {/* Central scrollable column */}
          <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: selectedDomain.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {selectedDomain.icon} {selectedDomain.label}
              </span>
              <span style={{ color: "#2C3133", fontSize: 12 }}>·</span>
              <span style={{ color: "#888C8E", fontSize: 11 }}>{selectedDomain.subtitle}</span>
            </div>

            {/* Dropzone card */}
            <section style={{ flexShrink: 0, background: "#1C1F21", border: "1px solid #2C3133", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16, minHeight: 280 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#888C8E", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {isTopologyDomain
                    ? "◎ Manifold Shape"
                    : isKnotDomain
                    ? "∞ Knot Formula"
                    : isCircuitDomain
                    ? "⊕ Boolean Circuit"
                    : isAlgebraicDomain
                    ? "∿ Implicit Polynomial"
                    : isBatchDomain
                    ? "⋯ Batch Configuration"
                    : isTDADomain
                    ? "⧖ Point Cloud & Filtration"
                    : isWLDomain
                    ? "⋍ Graph Twins"
                    : "⬆ Input / Data Source"}
                </span>
                <span style={{ color: "#888C8E", fontSize: 10 }}>
                  {isTopologyDomain
                    ? "Parametric mesh · Laplacian harmonics"
                    : isKnotDomain
                    ? "Torus knot parametric engine"
                    : isCircuitDomain
                    ? "AST parser · DAG · Critical path"
                    : isAlgebraicDomain
                    ? "Marching Cubes · Singularity scores"
                    : isBatchDomain
                    ? "Erdős-Rényi · G(N, p) random ensemble"
                    : isTDADomain
                    ? "Vietoris-Rips filtration · H₀ & H₁ barcodes"
                    : isWLDomain
                    ? "Weisfeiler-Lehman Graph Isomorphism"
                    : "All parsing is performed server-side"}
                </span>
              </div>
              {isTopologyDomain ? (
                <ManifoldDropzone
                  domain={selectedDomain}
                  manifoldShape={manifoldShape}
                  setManifoldShape={setManifoldShape}
                  deformation={deformation}
                  setDeformation={setDeformation}
                  exprX={exprX}
                  setExprX={setExprX}
                  exprY={exprY}
                  setExprY={setExprY}
                  exprZ={exprZ}
                  setExprZ={setExprZ}
                  uMin={uMin}
                  setUMin={setUMin}
                  uMax={uMax}
                  setUMax={setUMax}
                  vMin={vMin}
                  setVMin={setVMin}
                  vMax={vMax}
                  setVMax={setVMax}
                />
              ) : isKnotDomain ? (
                <KnotDropzone domain={selectedDomain} knotFormula={knotFormula} setKnotFormula={setKnotFormula} />
              ) : isCircuitDomain ? (
                <CircuitDropzone domain={selectedDomain} circuitFormula={circuitFormula} setCircuitFormula={setCircuitFormula} />
              ) : isAlgebraicDomain ? (
                <AlgebraicDropzone domain={selectedDomain} algebraicFormula={algebraicFormula} setAlgebraicFormula={setAlgebraicFormula} />
              ) : isBatchDomain ? (
                /* Batch Explorer configuration panel */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ color: "#888C8E", fontSize: 11, lineHeight: 1.7 }}>
                    Generates a random ensemble of Erdős-Rényi graphs G(N,&nbsp;p) with N&nbsp;∈&nbsp;[5,&nbsp;30] and p&nbsp;∈&nbsp;[0.05,&nbsp;0.95],
                    then computes their topological invariants for scatter analysis.
                  </div>
                  {/* Sample count selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ color: "#888C8E", fontSize: 10, letterSpacing: "0.06em", fontWeight: 600, textTransform: "uppercase" }}>Sample Count</span>
                      <span style={{ color: selectedDomain.color, fontFamily: "'Courier New', monospace", fontSize: 14, fontWeight: 700 }}>{batchSamples}</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={500}
                      step={10}
                      value={batchSamples}
                      onChange={(e) => setBatchSamples(Number(e.target.value))}
                      style={{ width: "100%", accentColor: selectedDomain.color }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#3A3F42", fontSize: 9 }}>
                      <span>20</span>
                      <span>500</span>
                    </div>
                  </div>
                  {/* Quick presets */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {[50, 100, 200, 500].map((n) => (
                      <button
                        key={n}
                        onClick={() => setBatchSamples(n)}
                        style={{
                          flex: 1,
                          background: batchSamples === n ? `${selectedDomain.color}30` : "#111315",
                          border: `1px solid ${batchSamples === n ? selectedDomain.color : "#2C3133"}`,
                          borderRadius: 7,
                          padding: "6px 0",
                          color: batchSamples === n ? selectedDomain.color : "#888C8E",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {/* Invariant legend */}
                  <div style={{ background: "#111315", border: "1px solid #2C3133", borderRadius: 8, padding: "10px 14px", fontSize: 10, lineHeight: 1.9, color: "#555A5D" }}>
                    <span style={{ color: "#888C8E", fontWeight: 600 }}>Scatter axes</span>
                    {"  "}
                    X: <code style={{ color: "#E6E4DF" }}>density  ρ</code>
                    {"  ·  "}
                    Y: <code style={{ color: "#E6E4DF" }}>algebraic connectivity  λ₂</code>
                    <br />
                    <span style={{ color: "#C05640" }}>●</span> Connected (β₀=1){"  "}
                    <span style={{ color: "#6B8075" }}>●</span> Disconnected (β₀&gt;1)
                  </div>
                </div>
              ) : isTDADomain ? (
                <TDADropzone
                  domain={selectedDomain}
                  shape={tdaShape}
                  setShape={setTdaShape}
                  numPoints={tdaNumPoints}
                  setNumPoints={setTdaNumPoints}
                  noiseLevel={tdaNoiseLevel}
                  setNoiseLevel={setTdaNoiseLevel}
                  onCompute={handleDiscover}
                  isLoading={isLoading}
                />
              ) : isWLDomain ? (
                <WLDropzone
                  domain={selectedDomain}
                  formula1={wlFormula1}
                  setFormula1={setWLFormula1}
                  formula2={wlFormula2}
                  setFormula2={setWLFormula2}
                />
              ) : (
                <Dropzone
                  domain={selectedDomain}
                  inputMode={inputMode}
                  setInputMode={setInputMode}
                  pastedText={pastedText}
                  setPastedText={setPastedText}
                  formulaText={formulaText}
                  setFormulaText={setFormulaText}
                  onFileLoad={handleFileLoad}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                />
              )}
            </section>

            {/* Discover / Generate button row */}
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <button
                id="discover-btn"
                onClick={isBatchDomain ? () => handleBatchGenerate(batchSamples) : handleDiscover}
                disabled={isLoading || (isTDADomain && !!tdaResult)}
                style={{
                  flex: 1,
                  background:
                    isLoading || (isTDADomain && !!tdaResult)
                      ? "#2C3133"
                      : `linear-gradient(135deg, ${selectedDomain.color}, ${selectedDomain.color}cc)`,
                  border: "none",
                  borderRadius: 10,
                  color: isLoading || (isTDADomain && !!tdaResult) ? "#888C8E" : "#E6E4DF",
                  cursor: isLoading || (isTDADomain && !!tdaResult) ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  padding: "16px 24px",
                  transition: "all 0.2s ease",
                  display: isTDADomain ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  textTransform: "uppercase",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && !(isTDADomain && !!tdaResult))
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  if (!(isTDADomain && !!tdaResult))
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>{" "}
                    {isTopologyDomain
                      ? "Generating Mesh…"
                      : isKnotDomain
                      ? "Generating Knot…"
                      : isCircuitDomain
                      ? "Parsing Circuit…"
                      : isAlgebraicDomain
                      ? "Tracing Variety…"
                      : isBatchDomain
                      ? `Sampling ${batchSamples} Graphs…`
                      : isTDADomain
                      ? "Computing Homology…"
                      : isWLDomain
                      ? "Testing Twins…"
                      : "Computing Invariants…"}
                  </>
                ) : (
                  <>
                    <span>
                      {isTopologyDomain
                        ? "◎"
                        : isKnotDomain
                        ? "∞"
                        : isCircuitDomain
                        ? "⊕"
                        : isAlgebraicDomain
                        ? "∿"
                        : isBatchDomain
                        ? "⋯"
                        : isTDADomain
                        ? "⧖"
                        : isWLDomain
                        ? "⋍"
                        : "⚗"}
                    </span>{" "}
                    {isTopologyDomain
                      ? "Generate Manifold"
                      : isKnotDomain
                      ? "Generate Knot"
                      : isCircuitDomain
                      ? "Analyse Circuit"
                      : isAlgebraicDomain
                      ? "Extract Variety"
                      : isBatchDomain
                      ? `Generate ${batchSamples} Random Graphs`
                      : isTDADomain
                      ? "Compute Homology"
                      : isWLDomain
                      ? "Run Twin Test"
                      : "Discover Structure"}
                  </>
                )}
              </button>

              {/* Oracle button — only visible in Batch Explorer when data exists */}
              {isBatchDomain && (
                <button
                  onClick={handleOracle}
                  disabled={!batchData || isThinking}
                  style={{
                    background:
                      !batchData || isThinking
                        ? "#1C1F21"
                        : "linear-gradient(135deg, #D19E4A22, #D19E4A11)",
                    border: `1px solid ${!batchData || isThinking ? "#2C3133" : "#D19E4A"}`,
                    borderRadius: 10,
                    padding: "16px 22px",
                    color: !batchData || isThinking ? "#555A5D" : "#D19E4A",
                    cursor: !batchData || isThinking ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.25s ease",
                    boxShadow: batchData && !isThinking ? "0 0 18px #D19E4A22" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (batchData && !isThinking) {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 32px #D19E4A44";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      batchData && !isThinking ? "0 0 18px #D19E4A22" : "none";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  {isThinking ? (
                    <>
                      <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Divining Laws…
                    </>
                  ) : (
                    <>🔮 Generate Conjecture</>
                  )}
                </button>
              )}
            </div>

            {/* Structure Microscope */}
            <section style={{ flexShrink: 0, minHeight: 400 }}>
              <Microscope
                result={result}
                knotResult={knotResult}
                manifoldResult={manifoldResult}
                circuitResult={circuitResult}
                algebraicResult={algebraicResult}
                batchData={batchData}
                tdaResult={tdaResult}
                wlResult={wlResult}
                wlStep={wlStep}
                setWlStep={setWlStep}
                conjectures={conjectures}
                oracleResult={oracleResult}
                domain={selectedDomain}
                error={error}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onEdgeRemove={
                  isKnotDomain ||
                  isTopologyDomain ||
                  isCircuitDomain ||
                  isAlgebraicDomain ||
                  isBatchDomain ||
                  isTDADomain ||
                  isWLDomain
                    ? undefined
                    : handleEdgeRemove
                }
                onNodeRemove={isTopologyDomain ? handleManifoldNodeRemove : undefined}
                perturbationCount={perturbationCount}
                deletedEdges={deletedEdges}
              />
            </section>
          </main>

          {/* Right panel */}
          <RightPanel
            domain={selectedDomain}
            params={params}
            setParams={setParams}
            isOpen={paramsOpen}
            setIsOpen={setParamsOpen}
            history={history}
            currentEdges={currentEdges}
          />
        </div>
      </div>
    </>
  );
}
