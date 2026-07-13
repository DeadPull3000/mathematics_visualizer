/**
 * frontend/lib/api.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side API utility for the Visual Mathematical Discovery Engine.
 *
 * All communication with the FastAPI backend goes through this module.
 * It is fully typed and throws structured errors that the UI can handle.
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Request / Response types (mirrors backend Pydantic schemas) ──────────────

export type ObjectType = "graph" | "knot" | "circuit";

export interface ProcessObjectRequest {
  type: ObjectType;
  data: Record<string, unknown>;
  parameters?: Record<string, unknown>;
}

export interface NodePayload {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  weight: number;
  group: string;
}

export interface EdgePayload {
  source: string;
  target: string;
  weight: number;
}

export interface InvariantPayload {
  name: string;
  value: unknown;
  description: string;
}

export interface ProcessObjectResponse {
  request_id: string;
  status: "success" | "error";
  object_type: ObjectType;
  nodes: NodePayload[];
  edges: EdgePayload[];
  invariants: InvariantPayload[];
  computation_time_ms: number;
  message: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  libraries: Record<string, string>;
}

// ─── Typed error class ────────────────────────────────────────────────────────

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

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
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
      // ignore JSON parse failure; keep the generic message
    }
    throw new ApiError(response.status, detail);
  }

  return response.json() as Promise<T>;
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Liveness probe.
 * @returns HealthResponse from the backend.
 */
export async function checkHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

/**
 * Send a mathematical object to the backend for invariant computation.
 *
 * @example
 * const result = await processObject("graph", {
 *   nodes: [0, 1, 2, 3],
 *   edges: [[0,1],[1,2],[2,3],[3,0],[0,2]],
 * });
 * console.log(result.invariants);
 *
 * @param type     Object category — "graph" | "knot" | "circuit"
 * @param data     Domain-specific representation
 * @param params   Advanced parameters (filtration radius, GNN layers…)
 */
export async function processObject(
  type: ObjectType,
  data: Record<string, unknown> = {},
  params: Record<string, unknown> = {}
): Promise<ProcessObjectResponse> {
  const payload: ProcessObjectRequest = {
    type,
    data,
    parameters: params,
  };

  console.group(`[API] POST /api/process-object — type: "${type}"`);
  console.log("Request payload:", payload);

  const result = await apiFetch<ProcessObjectResponse>("/api/process-object", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("Response:", result);
  console.log(`  ✓ ${result.nodes.length} nodes, ${result.edges.length} edges`);
  console.log(`  ✓ ${result.invariants.length} invariants computed in ${result.computation_time_ms} ms`);
  console.groupEnd();

  return result;
}
