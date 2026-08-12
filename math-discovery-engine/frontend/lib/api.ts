/**
 * frontend/lib/api.ts
 * -------------------------------------------------------------------------
 * Typed API client for the Visual Mathematical Discovery Engine.
 *
 * Step 3 update:
 *   - All responses are read as raw text FIRST (never blindly .json()).
 *   - Empty bodies and non-JSON payloads are caught and reported cleanly.
 *   - TopologyMetadata / updated MathResponse schemas added.
 *   - All parsing is delegated entirely to the backend.
 */

// --- Configuration -----------------------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// --- Shared types (mirrors backend models.py) --------------------------------

/** The three parsing strategies accepted by the backend. */
export type InputType = "edge_list" | "formula" | "json";

/** Request body for POST /api/process-object */
export interface MathRequest {
  /** How raw_data should be parsed. */
  input_type: InputType;
  /** The raw user text — completely unprocessed. */
  raw_data: string;
}

/** Topological invariants of the parsed graph (mirrors GraphMetadata). */
export interface GraphMetadata {
  /** |V|: cardinality of the vertex set. */
  num_nodes: number;
  /** |E|: cardinality of the edge set. */
  num_edges: number;
  /**
   * Graph density: 2|E| / (|V|(|V|-1)).
   * 0 = empty graph, 1 = complete graph.
   */
  density: number;
  /** True if all vertices are reachable from each other. */
  is_connected: boolean;
  /** beta_0: the 0th Betti number = number of connected components. */
  num_connected_components: number;
  /**
   * True if the graph is planar (Boyer-Myrvold test).
   * null if the planarity test was skipped for large graphs (|E| > 1000).
   */
  is_planar: boolean | null;
}

/** Spectral topology features (mirrors TopologyMetadata). */
export interface TopologyMetadata {
  /** Sorted eigenvalues of the combinatorial Laplacian. */
  laplacian_eigenvalues: number[];
  /**
   * Fiedler vector: mapping from node ID (string key) to its float value.
   * Identifies the optimal spectral bi-partition of the graph.
   */
  fiedler_vector: Record<string, number>;
  /**
   * Second-smallest Laplacian eigenvalue — the algebraic connectivity.
   * λ₂ = 0 iff the graph is disconnected.
   */
  algebraic_connectivity: number;
  /**
   * Betti numbers of the Simplicial Clique Complex lifted from the 1-skeleton.
   * [β₀, β₁, β₂]
   *   β₀ — connected components (same as metadata.num_connected_components)
   *   β₁ — independent 1D cycles / tunnels
   *   β₂ — enclosed 2D voids / bubbles
   */
  betti_numbers: number[];
  /**
   * Gradient saliency scores from the PyTorch GCN engine.
   * Maps node ID (string key) to a normalized float between 0.0 and 1.0.
   * Higher values indicate structurally anomalous / salient nodes.
   */
  saliency_scores?: Record<string, number>;
}

/** Response from POST /api/process-object */
export interface MathResponse {
  /** Sorted list of node identifiers (number | string). */
  nodes: (number | string)[];
  /** Edge list as [source, target] pairs. */
  edges: (number | string)[][];
  /** Computed topological invariants. */
  metadata: GraphMetadata;
  /** Spectral graph theory metrics (Laplacian). */
  topology: TopologyMetadata;
}

/** Response from GET /health */
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  libraries: Record<string, string>;
}

// --- Knot Theory types -------------------------------------------------------

/** Request body for POST /api/process-knot */
export interface KnotRequest {
  /** Torus knot formula, e.g. T_3_2 (Trefoil) or T_5_3. */
  formula: string;
}

/** A single node with fixed 3D world-space coordinates. */
export interface KnotNode {
  id: number;
  /** Fixed x coordinate (physics-locked in the 3D engine). */
  fx: number;
  /** Fixed y coordinate. */
  fy: number;
  /** Fixed z coordinate. */
  fz: number;
}

/** Topological invariants of a (p, q)-torus knot. */
export interface KnotInvariants {
  crossing_number: number;
  p: number;
  q: number;
  type: string;
  /** Discrete Gauss Linking Integral — chiral self-entanglement. */
  writhe?: number;
}

/** Response from POST /api/process-knot */
export interface KnotResponse {
  nodes: KnotNode[];
  edges: [number, number][];
  invariants: KnotInvariants;
  /** Local entanglement saliency from the Gauss Linking Integral — node ID → [0, 1]. */
  saliency_scores?: Record<string, number>;
}

// --- Topology (Surfaces & Manifolds) types -----------------------------------

/** Request body for POST /api/process-manifold */
export interface ManifoldRequest {
  /** Manifold shape identifier, e.g. "Sphere" or "Torus". */
  shape: "Sphere" | "Torus";
  /** Resolution of the parametric grid (number of divisions per axis). */
  resolution?: number;
  /**
   * Geometric deformation applied before computing the Cotangent Laplacian.
   * "none"    — standard parametric surface
   * "stretch" — prolate ellipsoid (z × 2)
   * "ripple"  — high-frequency sine interference pattern
   */
  deformation?: "none" | "stretch" | "ripple";
}

/** Topological invariants of the discretised manifold mesh. */
export interface ManifoldInvariants {
  vertices: number;
  edges: number;
  /** χ = V − E + F. Sphere = 2, Torus = 0. */
  euler_characteristic: number;
}

/** Response from POST /api/process-manifold */
export interface ManifoldResponse {
  /** Fixed-position nodes: id + fx/fy/fz world-space coordinates (scaled × 50). */
  nodes: KnotNode[];
  /** Edge list as [source, target] integer pairs. */
  edges: [number, number][];
  /**
   * Triangular face list — each entry is [node_i, node_j, node_k].
   * Derived by triangulating the parametric quad grid with two triangles per quad.
   */
  faces?: [number, number, number][];
  /** Euler characteristic and mesh counts. */
  invariants: ManifoldInvariants;
  /**
   * Laplacian eigenmode amplitudes — 2nd non-zero eigenvector of the
   * Cotangent Laplacian (encodes true 3D geometry, not just combinatorics).
   * Maps node ID (string key) to a signed float.
   */
  harmonics: Record<string, number>;
}

// --- Typed error class -------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    message?: string
  ) {
    super(message ?? detail);
    this.name = "ApiError";
  }
}

// --- Bulletproof JSON parser --------------------------------------------------

/**
 * Safely parse a response:
 *  1. Read as plain text so we never hit "Unexpected end of JSON input".
 *  2. Reject empty bodies explicitly.
 *  3. Wrap JSON.parse in try/catch and report the raw body prefix on failure.
 */
function safeParseJSON<T>(text: string, status: number): T {
  if (!text || text.trim() === "") {
    throw new ApiError(
      status,
      "The backend returned an empty response. It may have crashed — check the uvicorn terminal."
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.substring(0, 120).replace(/\n/g, " ");
    throw new ApiError(
      status,
      `Failed to parse JSON from backend. Response started with: "${preview}…"`
    );
  }
}

// --- Internal fetch helper ---------------------------------------------------

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // ── 1. Network-level failures (offline, wrong port, CORS preflight) ──────
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options?.headers,
      },
      ...options,
    });
  } catch (networkError) {
    throw new ApiError(
      0,
      `Network error — is the FastAPI backend running on port 8000?\n\nDetail: ${String(networkError)}`
    );
  }

  // ── 2. Always read as text first — never trust .json() ───────────────────
  let text: string;
  try {
    text = await response.text();
  } catch (readError) {
    throw new ApiError(
      response.status,
      `Could not read response body: ${String(readError)}`
    );
  }

  // ── 3. Non-2xx: try to extract a detail message, fall back to raw text ───
  if (!response.ok) {
    let detail = `HTTP ${response.status} ${response.statusText}`;
    if (text && text.trim() !== "") {
      try {
        const body = JSON.parse(text) as { detail?: string };
        detail = body?.detail ?? detail;
      } catch {
        // FastAPI sometimes returns HTML for unhandled 500s — show a safe slice
        detail = text.substring(0, 200).replace(/\s+/g, " ").trim();
      }
    }
    throw new ApiError(response.status, detail);
  }

  // ── 4. Successful response — parse JSON safely ───────────────────────────
  return safeParseJSON<T>(text, response.status);
}

// --- Public API functions ----------------------------------------------------

/**
 * Liveness probe — call before the first user interaction.
 */
export async function checkHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

/**
 * Send raw user input to the backend for parsing and invariant computation.
 *
 * The backend selects the appropriate parser based on `inputType` and returns
 * the parsed graph as a 1-skeleton together with topological metadata.
 *
 * @param inputType  "edge_list" | "formula" | "json"
 * @param rawData    The raw user text (unvalidated on the frontend)
 *
 * @example
 * // Edge list
 * const result = await processObject("edge_list", "0 1\n1 2\n2 3\n3 0");
 *
 * @example
 * // Formula
 * const result = await processObject("formula", "K_5");
 *
 * @example
 * // JSON file content
 * const result = await processObject("json", fileContentString);
 */
export async function processObject(
  inputType: InputType,
  rawData: string
): Promise<MathResponse> {
  const body: MathRequest = {
    input_type: inputType,
    raw_data: rawData,
  };
  return apiFetch<MathResponse>("/api/process-object", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Export the current graph state to a runnable Python script and trigger a
 * browser file-download of `discovery_graph.py`.
 *
 * The backend returns plain text (not JSON), so this function uses a raw
 * `fetch` call rather than the JSON-oriented `apiFetch` helper.
 *
 * @param request  A MathRequest describing the current graph (usually an
 *                 edge_list built from the live `currentEdges` state).
 *
 * @throws {ApiError}  On network failure or a non-2xx HTTP status.
 */
export async function exportToPython(request: MathRequest): Promise<void> {
  const url = `${API_BASE_URL}/api/export-python`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
      body: JSON.stringify(request),
    });
  } catch (networkError) {
    throw new ApiError(
      0,
      `Network error — is the FastAPI backend running on port 8000?\n\nDetail: ${String(networkError)}`
    );
  }

  let text: string;
  try {
    text = await response.text();
  } catch (readError) {
    throw new ApiError(response.status, `Could not read export response: ${String(readError)}`);
  }

  if (!response.ok) {
    // Try to extract a structured detail from FastAPI's JSON error body
    let detail = `HTTP ${response.status} ${response.statusText}`;
    if (text && text.trim() !== "") {
      try {
        const body = JSON.parse(text) as { detail?: string };
        detail = body?.detail ?? detail;
      } catch {
        detail = text.substring(0, 200).replace(/\s+/g, " ").trim();
      }
    }
    throw new ApiError(response.status, detail);
  }

  // The backend returns plain-text Python. If it ever wraps it in JSON,
  // gracefully extract the "script" field.
  let script = text;
  if (text.trimStart().startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as { script?: string };
      if (parsed.script) script = parsed.script;
    } catch {
      // Not JSON — use raw text as-is
    }
  }

  // Trigger a browser download
  const blob = new Blob([script], { type: "text/x-python" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "discovery_graph.py";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

/**
 * Send a knot formula to the backend and receive 3D geometry + invariants.
 *
 * @param request  A KnotRequest with a formula like "T_3_2".
 *
 * @example
 * const knot = await processKnot({ formula: "T_3_2" });
 */
export async function processKnot(request: KnotRequest): Promise<KnotResponse> {
  return apiFetch<KnotResponse>("/api/process-knot", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Send a manifold shape request to the backend and receive a 3D mesh with
 * Laplacian harmonics (spectral geometry).
 *
 * @param request  ManifoldRequest — shape ("Sphere" | "Torus") + optional resolution.
 *
 * @example
 * const mesh = await processManifold({ shape: "Torus", resolution: 15 });
 */
export async function processManifold(request: ManifoldRequest): Promise<ManifoldResponse> {
  return apiFetch<ManifoldResponse>("/api/process-manifold", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
