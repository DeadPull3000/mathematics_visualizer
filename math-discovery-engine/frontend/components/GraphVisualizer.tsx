/**
 * frontend/components/GraphVisualizer.tsx  (Step 5 — Laboratory Ledger & Ghost Edges)
 * --------------------------------------------------------------------------------------
 * Renders the parsed graph as a live, interactive 3D force-directed network.
 *
 * Ghost Edges
 * -----------
 * Deleted edges remain in the simulation data but are marked `isDeleted: true`.
 * They are rendered as faint translucent "ghost" strands — invisible by default,
 * but revealed whenever the user hovers a node they connect to.
 * Their d3 link-force strength is set to 0 so they exert no physical attraction.
 *
 * View Modes
 * ----------
 * "spectral"  — Fiedler-vector bi-partition colouring
 * "saliency"  — PyTorch GCN gradient saliency — colour + node size
 */

"use client";

import dynamic from "next/dynamic";
import React, { useRef, useMemo, useCallback, useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#141617",          // Obsidian Slate
  link: "#3a4145",        // Slate Joint (active edge, resting)
  linkGhost: "rgba(230, 228, 223, 0.10)", // Faint Alabaster (ghost)
  linkGhostHover: "rgba(192, 86, 64, 0.40)", // Terracotta tint on hover
  partA: "#C05640",       // Terracotta
  partB: "#6B8075",       // Faded Sage
  neutral: "#D19E4A",     // Aged Ochre
  low: "#888C8E",         // Faded Lead
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawNode = number | string;

export type ViewMode = "spectral" | "saliency";

export interface GraphVisualizerProps {
  /** Raw node IDs from the backend (numbers or strings). */
  nodes: RawNode[];
  /** Active edge list as [source, target] pairs (drives maths). */
  edges: RawNode[][];
  /**
   * Optional knot nodes with fixed 3D world-space coordinates.
   * When provided the visualizer renders in "knot" mode:
   * physics is bypassed, nodes are pinned, and links form a smooth continuous curve.
   */
  knotNodes?: { id: number; fx: number; fy: number; fz: number }[];
  /**
   * Deleted edges — kept in the 3D engine as ghost strands with zero force.
   * Revealed only when the user hovers a connected node.
   */
  deletedEdges?: (string | number)[][];
  /** Fiedler vector — maps stringified node ID → float. */
  fiedlerVector?: Record<string, number>;
  /** GCN gradient saliency scores — maps stringified node ID → [0,1]. */
  saliencyScores?: Record<string, number>;
  /**
   * Laplacian harmonic amplitudes — maps stringified node ID → signed float.
   * When present, the visualiser colours manifold mesh nodes by eigenmode
   * amplitude: Terracotta (+) · Ochre (≈0) · Sage (−).
   */
  harmonics?: Record<string, number>;
  /**
   * Triangular face list — each entry is [node_i, node_j, node_k].
   * When provided, the visualiser switches to "manifold" mode:
   * tiny nodes (relSize 2) and delicate wireframe links (width 1, faint Slate).
   * Harmonic coloring is applied to nodes via the `harmonics` prop.
   */
  faces?: [number | string, number | string, number | string][];
  /** Current visualisation mode. Defaults to "spectral". */
  viewMode?: ViewMode;
  /** Canvas height in pixels. Defaults to 400. */
  height?: number;
  /**
   * Fired when the user clicks an *active* edge.
   * Parent should re-submit the graph with this edge removed.
   */
  onEdgeRemove?: (source: string | number, target: string | number) => void;
  /**
   * Fired when the user clicks a node in manifold mode.
   * Parent should re-submit the manifold with this node excised.
   */
  onNodeRemove?: (nodeId: string | number) => void;
  /**
   * Active domain identifier. "circuit" enables DAG top-down layout and
   * directed arrows. Other values (or undefined) use the default physics layout.
   */
  domain?: string;
  /**
   * Gate type map for circuit mode — maps node ID → gate type string.
   * Used for Gate Types (spectral) colouring when domain === "circuit".
   */
  gateTypes?: Record<string, string>;
  /** WL step color IDs map — maps stringified node ID → integer color ID. */
  wlColors?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Internal force-graph node / link shapes
// ---------------------------------------------------------------------------

interface FGNode {
  id: string;
  color: string;
  label: string;
  saliency: number;
  // Fixed 3D coords — present only for knot nodes
  fx?: number;
  fy?: number;
  fz?: number;
}

interface FGLink {
  source: string | FGNode;   // FG resolves to object post-simulation
  target: string | FGNode;
  isDeleted: boolean;
}

// Safely resolve a post-simulation FGLink endpoint to its string id
function resolveId(endpoint: string | FGNode): string {
  return typeof endpoint === "object" && endpoint !== null
    ? (endpoint as FGNode).id
    : String(endpoint);
}

// ---------------------------------------------------------------------------
// Inner component — client-only
// ---------------------------------------------------------------------------

function GraphVisualizerInner({
  nodes,
  edges,
  knotNodes,
  faces,
  deletedEdges = [],
  fiedlerVector = {},
  saliencyScores = {},
  harmonics,
  viewMode = "spectral",
  height = 400,
  onEdgeRemove,
  onNodeRemove,
  domain,
  gateTypes = {},
  wlColors,
}: GraphVisualizerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ForceGraph3D = (ForceGraph3DComponent as any);

  const PALETTE = ["#E6E4DF", "#C05640", "#6B8075", "#D19E4A", "#888C8E", "#4A5D23", "#9B4F4F", "#C4A484", "#2C3133", "#5C7A89"];

  const isCircuitMode = domain === "circuit";
  // Is the visualiser rendering a parametric knot / manifold (fixed coords)?
  const isKnotMode = knotNodes !== undefined && knotNodes.length > 0;
  // Manifold mode: knotNodes supplied AND faces supplied — wireframe mesh aesthetic.
  const isManifoldMode = isKnotMode && faces !== undefined && faces.length > 0;

  // ForceGraph3D instance ref — used to poke the d3 physics engine directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  // Which node is the cursor over? Used to reveal connected ghost edges.
  const [hoveredNode, setHoveredNode] = useState<FGNode | null>(null);

  // ── Build graphData (nodes + active + ghost links) ──────────────────────
  const graphData = useMemo<{ nodes: FGNode[]; links: FGLink[] }>(() => {
    // ── Knot mode: use the pre-computed fixed coordinates ───────────────────
    if (isKnotMode && knotNodes) {
      const knotNodeObjs: FGNode[] = knotNodes.map((n) => {
        const key = String(n.id);
        const score = saliencyScores[key] ?? 0;

        // --- Manifold / knot harmonic colouring ---
        // Priority: if harmonics dict is present (manifold mode), colour by
        // eigenmode amplitude.  Otherwise fall back to knot entanglement saliency.
        let color: string;
        let label: string;
        if (harmonics && viewMode === "saliency") {
          // Harmonic amplitude: Terracotta (+) → Ochre (nodal) → Sage (−)
          const amp = harmonics[key] ?? 0;
          if (amp > 0.05)       color = COLORS.partA;   // #C05640 Terracotta
          else if (amp < -0.05) color = COLORS.partB;   // #6B8075 Sage
          else                  color = COLORS.neutral; // #D19E4A Ochre (nodal line)
          label = `Point ${key} | λ-amp: ${amp.toFixed(3)}`;
        } else if (viewMode === "saliency") {
          // Knot entanglement saliency colouring
          if (score > 0.6)      color = COLORS.partA;
          else if (score > 0.3) color = COLORS.neutral;
          else                  color = "#1C1F21";
          label = `Point ${key} | saliency: ${score.toFixed(3)}`;
        } else {
          // Base geometry — calm uniform Sage
          color = COLORS.partB;
          label = `Point ${key}`;
        }

        return {
          id: key,
          color,
          label,
          saliency: score,
          fx: n.fx,
          fy: n.fy,
          fz: n.fz,
        };
      });
      const knotLinks: FGLink[] = edges.map(([src, tgt]) => ({
        source: String(src),
        target: String(tgt),
        isDeleted: false,
      }));
      return { nodes: knotNodeObjs, links: knotLinks };
    }

    // ── Standard graph / circuit mode ───────────────────────────────────────
    const nodeObjs: FGNode[] = nodes.map((rawId) => {
      const key = String(rawId);

      let color: string;
      let label: string;
      const score = saliencyScores[key] ?? 0;

      if (wlColors) {
        const wlId = wlColors[key] ?? 0;
        color = PALETTE[wlId % PALETTE.length];
        label = `Node ${key} | WL Color: ${wlId}`;
      } else if (isCircuitMode) {
        const gateType = gateTypes[key] ?? "VAR";
        if (viewMode === "saliency") {
          // Critical Path colouring: 1.0 = Terracotta, 0.2 = dark Chalkboard
          color = score >= 0.9 ? COLORS.partA : "#1C1F21";
        } else {
          // Gate Types colouring
          const gateColors: Record<string, string> = {
            VAR: "#E6E4DF",   // Alabaster — input variable
            AND: "#D19E4A",   // Ochre
            OR:  "#6B8075",   // Sage
            NOT: "#888C8E",   // Lead
            XOR: "#888C8E",   // Lead (same as NOT)
          };
          color = gateColors[gateType] ?? COLORS.neutral;
        }
        label = gateType === "VAR" ? `${key} (input)` : `${key} · ${gateType}`;
      } else {
        // Spectral colouring (Fiedler vector partitioning)
        const fv = fiedlerVector[key];
        let spectralColor: string;
        if (fv === undefined || fv === null || Math.abs(fv) < 1e-10) spectralColor = COLORS.neutral;
        else if (fv > 0) spectralColor = COLORS.partA;
        else spectralColor = COLORS.partB;

        // Saliency colouring
        let saliencyColor: string;
        if (score > 0.6) saliencyColor = COLORS.partA;
        else if (score > 0.3) saliencyColor = COLORS.neutral;
        else saliencyColor = COLORS.low;

        color = viewMode === "saliency" ? saliencyColor : spectralColor;
        const saliencyLabel = viewMode === "saliency" ? ` | saliency: ${score.toFixed(3)}` : "";
        label = `Node ${key}${saliencyLabel}`;
      }

      return { id: key, color, label, saliency: score };
    });

    // Active edges
    const activeLinks: FGLink[] = edges.map(([src, tgt]) => ({
      source: String(src),
      target: String(tgt),
      isDeleted: false,
    }));

    // Ghost edges — deleted but still rendered (zero force, faint colour)
    const ghostLinks: FGLink[] = deletedEdges.map(([src, tgt]) => ({
      source: String(src),
      target: String(tgt),
      isDeleted: true,
    }));

    return { nodes: nodeObjs, links: [...activeLinks, ...ghostLinks] };
  }, [isKnotMode, isCircuitMode, knotNodes, nodes, edges, deletedEdges, fiedlerVector, saliencyScores, gateTypes, viewMode, harmonics, wlColors]);

  // ── Zero-out ghost link force after graphData changes ───────────────────
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // Give the engine a tick to ingest the new data, then patch link strength.
    const t = setTimeout(() => {
      try {
        const linkForce = fg.d3Force("link");
        if (linkForce) {
          linkForce.strength((link: FGLink) => (link.isDeleted ? 0 : 1));
          fg.d3ReheatSimulation?.();
        }
      } catch {
        // Gracefully swallow if the engine isn't ready yet
      }
    }, 50);
    return () => clearTimeout(t);
  }, [graphData]);

  // ── Edge click — only fires for active edges ─────────────────────────────
  const handleLinkClick = useCallback(
    (link: FGLink) => {
      if (link.isDeleted || !onEdgeRemove) return;
      onEdgeRemove(resolveId(link.source), resolveId(link.target));
    },
    [onEdgeRemove]
  );

  // ── Cursor update on link hover ──────────────────────────────────────────
  const handleLinkHover = useCallback(
    (link: FGLink | null) => {
      const el = fgRef.current?.renderer?.()?.domElement as HTMLElement | undefined;
      if (el) el.style.cursor = link && !link.isDeleted ? "pointer" : "default";
    },
    []
  );

  // ── Per-link colour — ghost vs active + hovered reveal ──────────────────
  const getLinkColor = useCallback(
    (link: FGLink) => {
      if (!link.isDeleted) return COLORS.link;
      // Ghost: show a warmer tint if either endpoint is the hovered node
      if (hoveredNode) {
        const src = resolveId(link.source);
        const tgt = resolveId(link.target);
        if (src === hoveredNode.id || tgt === hoveredNode.id) {
          return COLORS.linkGhostHover;
        }
      }
      return COLORS.linkGhost;
    },
    [hoveredNode]
  );

  // ── Per-link visibility — ghosts hidden unless node hovered ─────────────
  const getLinkVisibility = useCallback(
    (link: FGLink) => {
      if (!link.isDeleted) return true;
      if (!hoveredNode) return false;
      const src = resolveId(link.source);
      const tgt = resolveId(link.target);
      return src === hoveredNode.id || tgt === hoveredNode.id;
    },
    [hoveredNode]
  );

  return (
    <div
      id="graph-3d-canvas"
      style={{
        width: "100%",
        height,
        background: COLORS.bg,
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <ForceGraph3D
        key={`${graphData.nodes.length}-${graphData.links.length}-${viewMode}`}
        ref={fgRef}
        graphData={graphData}
        width={undefined}
        height={height}
        backgroundColor={COLORS.bg}
        // ── DAG layout (circuit mode only) ─────────────────────────────────
        dagMode={isCircuitMode ? "td" : undefined}
        dagLevelDistance={isCircuitMode ? 40 : undefined}
        // ── Nodes ──────────────────────────────────────────────────────────
        nodeId="id"
        nodeColor={(n: FGNode) => n.color}
        nodeLabel={(n: FGNode) => n.label}
        nodeRelSize={
          wlColors
            ? 6
            : isCircuitMode
            ? 5                                                       // circuit: uniform base size
            : isManifoldMode
            ? 2                                                       // manifold: tiny uniform spheres
            : isKnotMode
            ? (viewMode === "saliency" && !harmonics ? undefined : 3) // knot: fixed size or entanglement-scaled
            : (viewMode === "saliency" ? undefined : 5)               // graph: fixed or saliency-scaled
        }
        nodeVal={
          isCircuitMode && viewMode === "saliency"
            ? (n: FGNode) => (n.saliency >= 0.9 ? 8 : 3)            // circuit: critical=8, off=3
            : isKnotMode && viewMode === "saliency" && !harmonics
            ? (n: FGNode) => 2 + n.saliency * 5                      // knot: 2–7 by entanglement
            : (!isKnotMode && !isCircuitMode && viewMode === "saliency")
            ? (n: FGNode) => 3 + n.saliency * 8                      // graph: 3–11 by GCN saliency
            : undefined
        }
        nodeOpacity={isKnotMode ? (isManifoldMode ? 0.85 : 1) : 0.92}
        onNodeHover={(node: FGNode | null) => setHoveredNode(node)}
        onNodeClick={(node: FGNode) => { if (onNodeRemove) onNodeRemove(node.id); }}
        // ── Links ──────────────────────────────────────────────────────────────
        linkColor={isManifoldMode
          ? () => "rgba(44, 49, 51, 0.55)"              // manifold: faint Slate Joint wireframe
          : isKnotMode
          ? () => COLORS.partA                           // knot: Terracotta strand
          : getLinkColor
        }
        linkWidth={isManifoldMode ? 1 : isKnotMode ? 3 : ((link: FGLink) => (link.isDeleted ? 0.5 : 1.5))}
        linkOpacity={isKnotMode ? 1 : 0.8}
        linkDashLen={isKnotMode ? undefined : ((link: FGLink) => (link.isDeleted ? 4 : undefined))}
        linkDashGap={isKnotMode ? undefined : ((link: FGLink) => (link.isDeleted ? 3 : undefined))}
        linkVisibility={isKnotMode ? true : getLinkVisibility}
        linkHoverPrecision={onEdgeRemove ? 6 : 2}
        linkDirectionalArrowLength={isCircuitMode ? 3.5 : 0}
        linkDirectionalArrowRelPos={1}
        onLinkHover={isKnotMode ? undefined : handleLinkHover}
        onLinkClick={isKnotMode ? undefined : handleLinkClick}
        // ── Performance ────────────────────────────────────────────────────
        warmupTicks={isKnotMode || isCircuitMode ? 0 : 60}
        cooldownTime={isKnotMode || isCircuitMode ? 0 : 3000}
        showNavInfo={false}
      />

      {/* ── Floating tip ─────────────────────────────────────────────────── */}
      {(onEdgeRemove || onNodeRemove) && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1C1F21cc",
            backdropFilter: "blur(6px)",
            border: "1px solid #2C3133",
            borderRadius: 20,
            padding: "5px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 11 }}>💡</span>
          <span style={{ color: "#888C8E", fontSize: 10, letterSpacing: "0.03em" }}>
            {onNodeRemove
              ? "Click any node to puncture the manifold and warp the harmonics"
              : "Click any edge to cut it · hover a node to reveal ghost edges"}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic import guard — SSR safety
// ---------------------------------------------------------------------------

const ForceGraph3DComponent = dynamic(
  () => import("react-force-graph-3d").then((mod) => mod.default),
  { ssr: false }
);

const GraphVisualizer = dynamic(
  () => Promise.resolve(GraphVisualizerInner),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: 400,
          background: "#0F1113",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
          color: "#888C8E",
          fontSize: 12,
          letterSpacing: "0.04em",
        }}
      >
        <span style={{ fontSize: 28, display: "inline-block", animation: "spin 1.2s linear infinite" }}>
          ⟳
        </span>
        Initialising WebGL renderer…
      </div>
    ),
  }
);

export default GraphVisualizer;
