"""
Visual Mathematical Discovery Engine - Graph Parsers (Step 2)
=============================================================
Converts raw user input strings into validated NetworkX graph objects
that serve as the 1-skeleton for Simplicial Complex computations.

Each public parser follows a strict contract:
  - Returns an ``nx.Graph`` on success.
  - Raises a ``ValueError`` with a clear, user-friendly message on failure.
  - The FastAPI endpoint wraps ``ValueError`` in an HTTP 400 response.

Supported parsers
-----------------
parse_edge_list(raw_data)  -- whitespace/comma-separated edge list
parse_formula(raw_data)    -- K_n / C_n / P_n graph-theoretic notation
parse_json(raw_data)       -- NetworkX node-link JSON format

Safety limits
-------------
MAX_NODES = 2,000   prevents DoS via gigantic vertex sets
MAX_EDGES = 10,000  prevents DoS via dense adjacency matrices
"""

from __future__ import annotations

import json
import re
from typing import Final, Union

import networkx as nx

# --- Safety thresholds --------------------------------------------------------

MAX_NODES: Final[int] = 2_000
MAX_EDGES: Final[int] = 10_000

# --- Formula regex ------------------------------------------------------------
# Matches various graph formulas with case-insensitive prefixes and arguments
# separated by underscores. Examples: K_5, B_5_2, ER_10_0.5

_FORMULA_RE: Final[re.Pattern[str]] = re.compile(
    r"^\s*(?P<kind>[a-zA-Z]+)_(?P<args>[0-9]+(?:_[0-9.]+)*)\s*$"
)

# --- Internal helpers ---------------------------------------------------------


def _normalise_node(token: str) -> Union[int, str]:
    """
    Convert a raw token to an int node ID where possible.

    Canonical integer node IDs allow NetworkX to use compact adjacency
    matrix representations and enable direct numpy indexing.

    Parameters
    ----------
    token : str
        A raw whitespace-stripped node label from the input.

    Returns
    -------
    int | str
        The integer value if the token is a valid base-10 integer,
        otherwise the original string (e.g. "a", "v1", "source").
    """
    try:
        return int(token)
    except ValueError:
        return token


def _check_size(graph: nx.Graph, context: str) -> None:
    """
    Raise a ValueError if the graph exceeds the declared safety limits.

    This is a defence-in-depth check applied *after* the graph is built
    so that even unexpectedly large formula outputs are caught.

    Parameters
    ----------
    graph : nx.Graph
        The graph to validate.
    context : str
        Human-readable parser name used in the error message.

    Raises
    ------
    ValueError
        If |V| > MAX_NODES or |E| > MAX_EDGES.
    """
    n, m = graph.number_of_nodes(), graph.number_of_edges()
    if n > MAX_NODES:
        raise ValueError(
            f"[{context}] The resulting graph has {n:,} nodes, which exceeds "
            f"the safety limit of {MAX_NODES:,}. Please use a smaller input."
        )
    if m > MAX_EDGES:
        raise ValueError(
            f"[{context}] The resulting graph has {m:,} edges, which exceeds "
            f"the safety limit of {MAX_EDGES:,}. Please use a smaller input."
        )


# --- Public parsers -----------------------------------------------------------


def parse_edge_list(raw_data: str) -> nx.Graph:
    """
    Parse a whitespace- or comma-separated edge list into an undirected graph.

    Format rules
    ------------
    - Each non-blank line describes exactly one edge.
    - The two node tokens on a line may be separated by any whitespace
      and/or commas ("0 1", "0,1", "0, 1" are all valid).
    - Nodes are normalised to ``int`` where possible; otherwise kept as
      ``str`` (e.g. named nodes such as "A", "B").
    - Lines that are entirely blank or consist only of whitespace are
      silently skipped.
    - Duplicate edges are silently collapsed (simple graph semantics).
    - Self-loops (u == v) are silently discarded.

    Parameters
    ----------
    raw_data : str
        The raw edge-list string from the frontend textarea.

        Example::

            0 1
            1 2
            2 3
            3 0
            0 2

    Returns
    -------
    nx.Graph
        An undirected simple graph with no self-loops.

    Raises
    ------
    ValueError
        - If the input contains no non-blank lines.
        - If any non-blank line does not contain exactly two tokens.
        - If the resulting graph exceeds the safety size limits.
    """
    # Normalise commas to spaces so "0,1" and "0 1" are treated identically.
    normalised = raw_data.replace(",", " ")
    lines = [ln.strip() for ln in normalised.splitlines() if ln.strip()]

    if not lines:
        raise ValueError(
            "[Edge List] The input is empty after removing blank lines. "
            "Please enter at least one edge (e.g. '0 1' or '0,1')."
        )

    graph = nx.Graph()
    for line_num, line in enumerate(lines, start=1):
        tokens = line.split()
        if len(tokens) != 2:
            raise ValueError(
                f"[Edge List] Line {line_num} is malformed: {line!r}. "
                "Each line must contain exactly two node identifiers, "
                "separated by whitespace or a comma. "
                "Example: '0 1' or 'source target'."
            )
        u = _normalise_node(tokens[0])
        v = _normalise_node(tokens[1])
        if u != v:           # silently discard self-loops
            graph.add_edge(u, v)

    _check_size(graph, "Edge List")
    return graph


def parse_formula(raw_data: str) -> nx.Graph:
    """
    Parse a graph-theoretic formula string into a NetworkX graph.

    Supported formulae
    ------------------
    +--------+----------------------------------+-----------------------------+
    | Symbol | Graph family                     | NetworkX generator          |
    +========+==================================+=============================+
    | K_n    | Complete graph on n vertices     | ``nx.complete_graph(n)``    |
    | C_n    | Cycle graph on n vertices        | ``nx.cycle_graph(n)``       |
    | P_n    | Path graph on n vertices         | ``nx.path_graph(n)``        |
    | S_n    | Star graph on n vertices         | ``nx.star_graph(n)``        |
    | B_n_m  | Barbell graph                    | ``nx.barbell_graph(n, m)``  |
    | G_n_m  | 2D Grid graph                    | ``nx.grid_2d_graph(n, m)``  |
    | ER_n_p | Erdos-Renyi graph                | ``nx.erdos_renyi_graph(n,p)``|
    +--------+----------------------------------+-----------------------------+

    Notes
    -----
    - The match is case-insensitive (e.g., k_5, K_5).
    - Grid graphs have their tuple node labels converted to strings.

    Parameters
    ----------
    raw_data : str
        A formula string such as "K_5", "B_3_2", or "ER_10_0.5".

    Returns
    -------
    nx.Graph
        An undirected graph generated by the matching NetworkX factory.

    Raises
    ------
    ValueError
        - If the formula does not match the expected pattern.
        - If parameters are invalid.
        - If the resulting graph exceeds the safety size limits.
    """
    match = _FORMULA_RE.match(raw_data)
    if match is None:
        raise ValueError(
            f"[Formula] Could not parse {raw_data!r}. "
            "Supported formats: K_n (complete), C_n (cycle), P_n (path), S_n (star), "
            "B_n_m (barbell), G_n_m (grid_2d), ER_n_p (erdos_renyi). "
            "Examples: 'K_5', 'B_5_2', 'ER_10_0.5'. The match is case-insensitive."
        )

    kind = match.group("kind").upper()
    args_str = match.group("args")
    args = args_str.split("_")

    try:
        if kind in ("K", "C", "P", "S") and len(args) == 1:
            n = int(args[0])
            if n <= 0:
                raise ValueError("n must be a positive integer.")
            if kind == "K": graph = nx.complete_graph(n)
            elif kind == "C": graph = nx.cycle_graph(n)
            elif kind == "P": graph = nx.path_graph(n)
            elif kind == "S": graph = nx.star_graph(n)
        elif kind in ("B", "G") and len(args) == 2:
            n, m = int(args[0]), int(args[1])
            if kind == "B":
                if n < 2 or m < 0:
                    raise ValueError("Barbell graph requires n >= 2 and m >= 0.")
                graph = nx.barbell_graph(n, m)
            elif kind == "G":
                if n <= 0 or m <= 0:
                    raise ValueError("Grid graph requires positive integers n and m.")
                graph = nx.grid_2d_graph(n, m)
                # Relabel tuple nodes to integers to work with our engine
                graph = nx.convert_node_labels_to_integers(graph)
        elif kind == "ER" and len(args) == 2:
            n = int(args[0])
            p = float(args[1])
            if n <= 0 or not (0.0 <= p <= 1.0):
                raise ValueError("n must be a positive integer and p must be between 0.0 and 1.0.")
            graph = nx.erdos_renyi_graph(n, p)
        else:
            raise ValueError(f"Unknown formula or wrong number of arguments for {kind}.")
    except ValueError as e:
        # Wrap internal ValueError with context
        if "[Formula]" not in str(e):
            raise ValueError(f"[Formula] Invalid parameters for {raw_data!r}: {e}") from e
        raise e

    _check_size(graph, "Formula")
    return graph


def parse_json(raw_data: str) -> nx.Graph:
    """
    Parse a NetworkX *node-link* JSON string into a simple undirected graph.

    Expected format
    ---------------
    The JSON must conform to the schema produced by ``nx.node_link_data(G)``::

        {
          "directed":    false,
          "multigraph":  false,
          "graph":       {},
          "nodes":       [{"id": 0}, {"id": 1}, ...],
          "links":       [{"source": 0, "target": 1, ...}, ...]
        }

    The ``"links"`` key is the standard used by D3 and NetworkX >= 3.0.

    Coercion rules
    --------------
    - Directed graphs are silently converted to undirected via
      ``graph.to_undirected()`` so the 1-skeleton is always a simple graph.
    - Multi-graphs (parallel edges) are silently collapsed to a simple graph.
    - Self-loops are discarded after construction.

    Parameters
    ----------
    raw_data : str
        A JSON string, typically obtained by calling ``FileReader.readAsText``
        on a ``.json`` file uploaded by the user.

    Returns
    -------
    nx.Graph
        An undirected simple graph.

    Raises
    ------
    ValueError
        - If ``raw_data`` is not valid JSON.
        - If the JSON is not a dict, or is missing required node-link keys.
        - If NetworkX cannot reconstruct a graph from the data.
        - If the resulting graph exceeds the safety size limits.
    """
    # Step 1: JSON parsing
    try:
        payload = json.loads(raw_data)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"[JSON] The uploaded file is not valid JSON. "
            f"Parser error: {exc.msg} at line {exc.lineno}, column {exc.colno}. "
            "Ensure the file is saved as UTF-8 encoded JSON."
        ) from exc

    if not isinstance(payload, dict):
        raise ValueError(
            "[JSON] Expected a JSON object {{ ... }} at the root level. "
            "The file must be in NetworkX node-link format "
            "(produced by nx.node_link_data(G))."
        )

    # Step 2: NetworkX graph reconstruction
    try:
        # NetworkX >= 3.2 uses the keyword argument `edges` to specify
        # which key holds the edge array; older versions default to "links".
        try:
            graph: nx.Graph = nx.node_link_graph(payload, edges="links")
        except TypeError:
            # Older NetworkX (< 3.2) does not accept the `edges` kwarg.
            graph = nx.node_link_graph(payload)
    except Exception as exc:
        raise ValueError(
            f"[JSON] Failed to reconstruct a graph from the provided data: {exc}. "
            "The file must contain 'nodes' and 'links' (or 'edges') keys "
            "in NetworkX node-link format."
        ) from exc

    # Step 3: Normalise to a simple undirected graph
    if graph.is_directed():
        graph = graph.to_undirected()
    if graph.is_multigraph():
        graph = nx.Graph(graph)

    # Remove self-loops to guarantee 1-skeleton validity
    graph.remove_edges_from(nx.selfloop_edges(graph))

    _check_size(graph, "JSON")
    return graph
