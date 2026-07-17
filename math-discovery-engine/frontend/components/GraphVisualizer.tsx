/**
 * frontend/components/GraphVisualizer.tsx  (Step 3 — 3D Visualizer)
 * -----------------------------------------------------------------
 * Renders the parsed graph as a live, interactive 3D force-directed
 * network using react-force-graph-3d + Three.js.
 *
 * CRITICAL: react-force-graph-3d uses the `window` object (WebGL /
 * Three.js) and therefore CANNOT run during SSR.  The entire inner
 * component is lazy-loaded via Next.js `dynamic()` with `{ ssr: false }`.
 *
 * Node coloring: driven by the Fiedler vector (eigenvector of the
 * second-smallest Laplacian eigenvalue).
 *
 *   fiedler > 0         →  Terracotta  #C05640  (partition A)
 *   fiedler < 0         →  Faded Sage  #6B8075  (partition B)
 *   fiedler ≈ 0 / n/a   →  Aged Ochre  #D19E4A  (bridge / isolated)
 */

"use client";

import dynamic from "next/dynamic";
import React, { useRef, useMemo } from "react";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#141617",       // Obsidian Slate
  link: "#3a4145",     // Slate Joint (slightly lighter for visibility in 3D)
  partA: "#C05640",    // Terracotta  (Fiedler > 0)
  partB: "#6B8075",    // Faded Sage  (Fiedler < 0)
  neutral: "#D19E4A",  // Aged Ochre  (Fiedler ≈ 0 / missing)
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawNode = number | string;

export interface GraphVisualizerProps {
  /** Raw node IDs from the backend (numbers or strings). */
  nodes: RawNode[];
  /** Edge list as [source, target] pairs. */
  edges: RawNode[][];
  /**
   * Fiedler vector — maps stringified node ID to its float component.
   * Used to bi-colour the graph by spectral partition.
   */
  fiedlerVector?: Record<string, number>;
  /** Height of the canvas in pixels. Defaults to 400. */
  height?: number;
}

// ---------------------------------------------------------------------------
// Node type used internally
// ---------------------------------------------------------------------------

interface FGNode {
  id: string;
  color: string;
  label: string;
}

interface FGLink {
  source: string;
  target: string;
}

// ---------------------------------------------------------------------------
// Inner component — only ever rendered on the client
// ---------------------------------------------------------------------------

function GraphVisualizerInner({
  nodes,
  edges,
  fiedlerVector = {},
  height = 400,
}: GraphVisualizerProps) {
  // Lazy-import type so it never pollutes the module scope during SSR.
  // The actual runtime import happens inside dynamic(), but we still need
  // to import ForceGraph3D for use in JSX — dynamic handles the SSR guard.
  // We cast to `any` here because the generic overload on FCwithRef makes
  // it difficult to satisfy in a standard JSX expression.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ForceGraph3D = (ForceGraph3DComponent as any);

  const graphRef = useRef(null);

  const graphData = useMemo<{ nodes: FGNode[]; links: FGLink[] }>(() => {
    const nodeObjs: FGNode[] = nodes.map((rawId) => {
      const key = String(rawId);
      const fv = fiedlerVector[key];
      let color: string;
      if (fv === undefined || fv === null || Math.abs(fv) < 1e-10) {
        color = COLORS.neutral;
      } else if (fv > 0) {
        color = COLORS.partA;
      } else {
        color = COLORS.partB;
      }
      return { id: key, color, label: `Node ${key}` };
    });

    const linkObjs: FGLink[] = edges.map(([src, tgt]) => ({
      source: String(src),
      target: String(tgt),
    }));

    return { nodes: nodeObjs, links: linkObjs };
  }, [nodes, edges, fiedlerVector]);

  return (
    <div
      id="graph-3d-canvas"
      style={{
        width: "100%",
        height,
        background: COLORS.bg,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        width={undefined}           // let it fill the container width
        height={height}
        backgroundColor={COLORS.bg}
        // Nodes
        nodeId="id"
        nodeColor={(n: FGNode) => n.color}
        nodeLabel={(n: FGNode) => n.label}
        nodeRelSize={5}
        nodeOpacity={0.92}
        // Links
        linkColor={() => COLORS.link}
        linkWidth={1}
        linkOpacity={0.5}
        // Performance
        warmupTicks={60}
        cooldownTime={3000}
        showNavInfo={false}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// We dynamically import the inner component so ForceGraph3D is never
// evaluated server-side (it references `window` at module load time).
// ---------------------------------------------------------------------------

// This import is resolved at runtime only on the client.
// It must be a top-level dynamic() call so Next.js can statically analyse it.
const ForceGraph3DComponent = dynamic(
  () => import("react-force-graph-3d").then((mod) => mod.default),
  { ssr: false }
);

// The public export wraps GraphVisualizerInner in its own dynamic() so the
// entire component tree — including the ForceGraph3D JSX — is client-only.
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
        <span
          style={{
            fontSize: 28,
            display: "inline-block",
            animation: "spin 1.2s linear infinite",
          }}
        >
          ⟳
        </span>
        Initialising WebGL renderer…
      </div>
    ),
  }
);

export default GraphVisualizer;
