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
  normalized_eigenvalues?: number[];
  spectral_gap?: number;
  cheeger_bounds?: { lower: number; upper: number };
  heat_kernel_signatures?: Record<string, Record<string, number>>;
  h1_generators?: (number | string)[][];
  triangles?: (number | string)[][];
  graph_family?: {
    family_name?: string;
    is_tree?: boolean;
    is_forest?: boolean;
    is_bipartite?: boolean;
    is_eulerian?: boolean;
    is_regular?: boolean;
    regular_degree?: number | null;
    is_chordal?: boolean | null;
    girth?: number | null;
    diameter?: number | null;
    radius?: number | null;
    clustering_coefficient?: number;
    transitivity?: number;
  };
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
  /** Cache status ("HIT" | "MISS") injected by Phase 4 middleware. */
  _cacheStatus?: string;
  /** Execution latency in milliseconds. */
  _latencyMs?: number;
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
  alexander_polynomial?: string;
  genus?: number;
  bridge_index?: number;
}

// --- Topology (Surfaces & Manifolds) types -----------------------------------

/** Request body for POST /api/process-manifold */
export interface ManifoldRequest {
  /** Manifold shape identifier: "Sphere", "Torus", or "Custom". */
  shape: "Sphere" | "Torus" | "Custom";
  /** Resolution of the parametric grid (number of divisions per axis). */
  resolution?: number;
  /**
   * Geometric deformation applied before computing the Cotangent Laplacian.
   * "none"    — standard parametric surface
   * "stretch" — prolate ellipsoid (z × 2)
   * "ripple"  — high-frequency sine interference pattern
   */
  deformation?: "none" | "stretch" | "ripple";
  /** Custom parametric equation for X(u, v). Required when shape is "Custom". */
  expr_x?: string;
  /** Custom parametric equation for Y(u, v). Required when shape is "Custom". */
  expr_y?: string;
  /** Custom parametric equation for Z(u, v). Required when shape is "Custom". */
  expr_z?: string;
  /** Minimum value of the u parameter. Default: 0. */
  u_min?: number;
  /** Maximum value of the u parameter. Default: 2π. */
  u_max?: number;
  /** Minimum value of the v parameter. Default: 0. */
  v_min?: number;
  /** Maximum value of the v parameter. Default: 2π. */
  v_max?: number;
  /** Node IDs to excise from the manifold mesh (Manifold Surgery). */
  deleted_nodes?: number[];
  parameter_t?: number;
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
  gaussian_curvature?: Record<string, number>;
  mean_curvature?: Record<string, number>;
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
  const parsed = safeParseJSON<T>(text, response.status);
  if (typeof parsed === "object" && parsed !== null) {
    const cacheHeader = response.headers.get("X-Cache");
    const timeHeader = response.headers.get("X-Process-Time-Ms");
    if (cacheHeader) {
      (parsed as Record<string, unknown>)._cacheStatus = cacheHeader;
    }
    if (timeHeader) {
      (parsed as Record<string, unknown>)._latencyMs = parseFloat(timeHeader);
    }
  }
  return parsed;
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

// ---------------------------------------------------------------------------
// Complexity Theory — Boolean Circuit
// ---------------------------------------------------------------------------

/** Request body for POST /api/process-circuit */
export interface CircuitRequest {
  /** Boolean logic formula, e.g. "(x1 & x2) | (~x3 & x4)". */
  formula: string;
}

/** Single gate/variable node in the circuit DAG. */
export interface CircuitNode {
  /** Unique string ID (variable name for VAR nodes, uuid for gates). */
  id: string;
  /** Gate type: "VAR", "AND", "OR", "NOT", or "XOR". */
  gate_type: "VAR" | "AND" | "OR" | "NOT" | "XOR";
}

/** Response from POST /api/process-circuit */
export interface CircuitResponse {
  /** All gate and variable nodes in the DAG. */
  nodes: CircuitNode[];
  /** Directed edges [source, target] — data flows from inputs to output. */
  edges: [string, string][];
  /** Circuit complexity invariants. */
  invariants: {
    /** Longest path length = circuit depth = time complexity. */
    depth: number;
    /** Number of logic gates (AND, OR, NOT, XOR). */
    num_gates: number;
    /** Number of input variables (VAR nodes). */
    num_vars: number;
  };
  /** Saliency map: 1.0 for nodes on the critical path, 0.2 otherwise. */
  saliency_scores: Record<string, number>;
}

/**
 * Send a boolean circuit formula to the backend and receive the DAG
 * representation with depth and critical path saliency.
 *
 * @param request  A CircuitRequest with a formula like "(x1 & x2) | ~x3".
 *
 * @example
 * const circuit = await processCircuit({ formula: "(x1 & x2) | (~x3 & x4)" });
 */
export async function processCircuit(request: CircuitRequest): Promise<CircuitResponse> {
  return apiFetch<CircuitResponse>("/api/process-circuit", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ---------------------------------------------------------------------------
// Algebraic Geometry — Implicit Varieties
// ---------------------------------------------------------------------------

/** Request body for POST /api/process-algebraic */
export interface AlgebraicRequest {
  /**
   * Implicit polynomial equation F(x, y, z) = 0.
   * Uses Python / numexpr syntax — `**` for powers.
   * Example: "x**2 + y**2 - z**2" (cone)
   */
  formula: string;
  /**
   * Grid resolution for the Marching Cubes voxel lattice.
   * Higher values produce finer meshes but are slower.
   * @default 30
   */
  resolution?: number;
  /**
   * Spatial extent: the grid spans [-bounds, bounds] on each axis.
   * @default 3.0
   */
  bounds?: number;
  parameter_t?: number;
}

/** Response from POST /api/process-algebraic */
export interface AlgebraicResponse {
  /** Isosurface vertices with 3D display coordinates. */
  nodes: { id: number; fx: number; fy: number; fz: number }[];
  /** Triangular faces as [v0, v1, v2] index triples. */
  faces: [number, number, number][];
  /** Wireframe edges extracted from faces as [src, tgt] pairs. */
  edges: [number, number][];
  /** High-level surface invariants. */
  invariants: {
    /** Total number of isosurface vertices. */
    num_vertices: number;
    /** Total number of triangular faces. */
    num_faces: number;
  };
  /**
   * Singularity scores — maps node ID → [0, 1].
   * Score approaches 1.0 where the spatial gradient ‖∇F‖ ≈ 0,
   * indicating a singular point (cusp, node, pinch).
   */
  saliency_scores: Record<number, number>;
  /**
   * Symbolic Jacobian [∂F/∂x, ∂F/∂y, ∂F/∂z] as SymPy string expressions.
   * e.g. ["2*x", "2*y", "-2*z"]
   */
  jacobian?: string[];
  /**
   * Exact symbolic singular points where F = 0 AND ∇F = 0.
   * Each element maps variable names to exact symbolic values (e.g. "0", "sqrt(2)").
   * May contain an `error` key if the system was too complex to solve in time.
   */
  exact_singularities?: Record<string, string>[];
  grobner_basis?: string[];
  hessian_determinant?: string;
}

/**
 * Submit an implicit polynomial equation to the backend and receive
 * a Marching Cubes isosurface with singularity saliency scores.
 *
 * @param request  An AlgebraicRequest with a formula like "x**2 + y**2 - z**2".
 *
 * @example
 * const variety = await processAlgebraic({ formula: "x**2 + y**2 - z**3" });
 */
export async function processAlgebraic(request: AlgebraicRequest): Promise<AlgebraicResponse> {
  return apiFetch<AlgebraicResponse>("/api/process-algebraic", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ---------------------------------------------------------------------------
// Batch Dataset Explorer
// ---------------------------------------------------------------------------

/** Request body for POST /api/process-batch */
export interface BatchRequest {
  /**
   * Number of random Erdős-Rényi graphs to generate.
   * @default 100
   */
  num_samples?: number;
}

/** Single data point returned by the batch generator. */
export interface BatchDataPoint {
  /** Sequential index of this sample. */
  id: number;
  /** Number of vertices. */
  vertices: number;
  /** Number of edges. */
  edges: number;
  /** Graph density ∈ [0, 1]. */
  density: number;
  /** Second-smallest Laplacian eigenvalue. 0 ⇒ disconnected. */
  algebraic_connectivity: number;
  /** Betti-0 = number of connected components. */
  betti_0: number;
}

/** Response from POST /api/process-batch */
export interface BatchResponse {
  /** Array of graph invariant records. */
  data: BatchDataPoint[];
}

/**
 * Generate a batch of random graphs with computed invariants.
 *
 * @param request  A BatchRequest, optionally specifying num_samples.
 *
 * @example
 * const batch = await processBatch({ num_samples: 200 });
 */
export async function processBatch(request: BatchRequest): Promise<BatchResponse> {
  return apiFetch<BatchResponse>("/api/process-batch", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ---------------------------------------------------------------------------
// Topological Data Analysis (Persistent Homology)
// ---------------------------------------------------------------------------

/** Request body for POST /api/process-tda */
export interface TDARequest {
  /** Point cloud shape: "noisy_circle" | "noisy_sphere" | "random_noise". */
  shape: "noisy_circle" | "noisy_sphere" | "random_noise" | string;
  /** Number of sample points in the cloud. Default: 150. */
  num_points?: number;
  /** Standard deviation of Gaussian noise. Default: 0.15. */
  noise_level?: number;
}

/** Response from POST /api/process-tda */
export interface TDAResponse {
  /** 3D coordinates for each sample point in the point cloud. */
  nodes: { id: number; fx: number; fy: number; fz: number }[];
  /**
   * Persistence barcodes:
   * H0: 0-dimensional components (birth-death pairs)
   * H1: 1-dimensional loops/holes (birth-death pairs)
   */
  barcodes: {
    H0: [number, number][];
    H1: [number, number][];
  };
}

/**
 * Send a TDA request to generate a 3D point cloud and compute Vietoris-Rips
 * persistent homology barcodes (H0 and H1).
 *
 * @param request  A TDARequest specifying shape, num_points, and noise_level.
 *
 * @example
 * const tda = await processTDA({ shape: "noisy_circle", num_points: 150, noise_level: 0.15 });
 */
export async function processTDA(request: TDARequest): Promise<TDAResponse> {
  return apiFetch<TDAResponse>("/api/process-tda", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ---------------------------------------------------------------------------
// Graph Theory — Weisfeiler-Lehman Isomorphism Test
// ---------------------------------------------------------------------------

/** Request body for POST /api/process-wl */
export interface WLRequest {
  /** First graph formula or edge list. */
  formula1: string;
  /** Second graph formula or edge list. */
  formula2: string;
}

/** Response from POST /api/process-wl */
export interface WLResponse {
  /** Nodes for the first graph. */
  graph1_nodes: { id: string | number; fx?: number; fy?: number; fz?: number }[];
  /** Edges for the first graph. */
  graph1_edges: [string | number, string | number][];
  /** Nodes for the second graph. */
  graph2_nodes: { id: string | number; fx?: number; fy?: number; fz?: number }[];
  /** Edges for the second graph. */
  graph2_edges: [string | number, string | number][];
  /** Color step progression for the first graph. Maps node ID to color ID. */
  wl_steps1: Record<string, number>[];
  /** Color step progression for the second graph. Maps node ID to color ID. */
  wl_steps2: Record<string, number>[];
  /** True if the WL test could not distinguish the graphs (possibly isomorphic). */
  is_isomorphic: boolean;
}

/**
 * Send two graphs to the backend to compute their 1-Weisfeiler-Lehman colorings.
 *
 * @param request  A WLRequest with two graph formulas/edge lists.
 *
 * @example
 * const result = await processWL({ formula1: "C_6", formula2: "P_6" });
 */
export async function processWL(request: WLRequest): Promise<WLResponse> {
  return apiFetch<WLResponse>("/api/process-wl", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ---------------------------------------------------------------------------
// Conjecture Oracle — SVD-based linear law discovery
// ---------------------------------------------------------------------------

/** Request body for POST /api/process-oracle */
export interface OracleRequest {
  /** The batch dataset of graph invariant dictionaries to analyse. */
  batch_data: Record<string, number>[];
}

/** Response from POST /api/process-oracle */
export interface BatchAnomaly {
  id: number;
  vertices: number;
  edges: number;
  density: number;
  betti_0: number;
  algebraic_connectivity: number;
  anomaly_score: number;
  reason: string;
}

export interface OracleResponse {
  /** Discovered linear and polynomial law strings. */
  conjectures: string[];
  linear_conjectures?: string[];
  polynomial_conjectures?: string[];
  anomalies?: BatchAnomaly[];
}

// ---------------------------------------------------------------------------
// Mathematical Narrator ("Professor's Notes")
// ---------------------------------------------------------------------------

export interface NarratorRequest {
  domain: string;
  invariants: Record<string, unknown>;
  formula?: string;
}

export interface NarratorResponse {
  summary: string;
  key_insights: string[];
  theoretical_connections: string[];
  open_questions: string[];
}

export async function processNarrator(request: NarratorRequest): Promise<NarratorResponse> {
  return apiFetch<NarratorResponse>("/api/narrate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ---------------------------------------------------------------------------
// GNN Playground (GCN, GAT, GraphSAGE)
// ---------------------------------------------------------------------------

export interface GNNInspectRequest {
  nodes: (number | string)[];
  edges: (number | string)[][];
  model_type: "GCN" | "GAT" | "GraphSAGE";
}

export interface GNNInspectResponse {
  model_type: string;
  saliency_scores: Record<string, number>;
  attention_weights: { source: number | string; target: number | string; weight: number }[];
  embeddings_2d: Record<string, [number, number]>;
}

export async function processGNNInspect(request: GNNInspectRequest): Promise<GNNInspectResponse> {
  return apiFetch<GNNInspectResponse>("/api/gnn-inspect", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Send a batch dataset to the Oracle engine to discover linear algebraic laws
 * via Singular Value Decomposition (SVD) null-space analysis.
 *
 * @param request  An OracleRequest with `batch_data` — list of graph invariant dicts.
 *
 * @example
 * const result = await processOracle({ batch_data: batchData });
 */
export async function processOracle(request: OracleRequest): Promise<OracleResponse> {
  return apiFetch<OracleResponse>("/api/process-oracle", {
    method: "POST",
    body: JSON.stringify(request),
  });
}



// ---------------------------------------------------------------------------
// Server-Sent Events (SSE) Batch Streaming & Cache Telemetry (Phase 4)
// ---------------------------------------------------------------------------

export interface BatchStreamEvent {
  current: number;
  total: number;
  sample: BatchDataPoint;
}

export async function streamBatch(
  numSamples: number,
  onProgress: (event: BatchStreamEvent) => void
): Promise<BatchDataPoint[]> {
  const url = `${API_BASE_URL}/api/stream-batch?num_samples=${numSamples}`;
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new ApiError(response.status, "Failed to initiate Server-Sent Events stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const collected: BatchDataPoint[] = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const chunk of lines) {
      const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (dataLine) {
        try {
          const parsed = JSON.parse(dataLine.slice(6));
          if (parsed.sample) {
            collected.push(parsed.sample);
            onProgress(parsed);
          }
        } catch {
          // partial JSON chunk buffer
        }
      }
    }
  }

  return collected;
}

export interface CacheStats {
  size: number;
  max_size: number;
  hits: number;
  misses: number;
  evictions: number;
  total_requests: number;
  hit_ratio: number;
}

export async function getCacheStats(): Promise<CacheStats> {
  return apiFetch<CacheStats>("/api/cache/stats");
}

export async function clearCache(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/cache/clear", { method: "POST" });
}
