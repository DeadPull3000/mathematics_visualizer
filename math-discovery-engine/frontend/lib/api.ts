/**
 * frontend/lib/api.ts
 * -------------------------------------------------------------------------
 * Typed API client for the Visual Mathematical Discovery Engine.
 *
 * Step 2 update: mirrors the new MathRequest / MathResponse backend schemas.
 * All parsing is delegated entirely to the backend -- the frontend only sends
 * the raw text and the input mode; it never tries to validate mathematics.
 */

// --- Configuration -----------------------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

/** Response from POST /api/process-object */
export interface MathResponse {
  /** Sorted list of node identifiers (number | string). */
  nodes: (number | string)[];
  /** Edge list as [source, target] pairs. */
  edges: (number | string)[][];
  /** Computed topological invariants. */
  metadata: GraphMetadata;
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

// --- Internal fetch helper ---------------------------------------------------

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
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
      "Network error — is the backend running on port 8000?",
      String(networkError)
    );
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      detail = body?.detail ?? detail;
    } catch {
      // keep the generic message if the error body is not JSON
    }
    throw new ApiError(response.status, detail);
  }

  return response.json() as Promise<T>;
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
