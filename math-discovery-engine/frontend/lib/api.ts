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
