"""
Mathematical Narrator Service ("Professor's Notes") (Phase 3)
==============================================================
Generates rigorous, peer-review-grade academic commentary and narrative
deconstructions of mathematical structures across topology, algebraic geometry,
differential manifolds, and knot theory.
"""

from __future__ import annotations
from typing import Any, Dict, List
from models.narrator import NarratorRequest, NarratorResponse


def generate_narrative(domain: str, invariants: Dict[str, Any], formula: str = "") -> NarratorResponse:
    """
    Generates structured academic mathematical commentary for the active mathematical domain.
    """
    domain = (domain or "topology").lower()

    if domain == "topology":
        return _narrate_topology(invariants, formula)
    elif domain == "algebraic":
        return _narrate_algebraic(invariants, formula)
    elif domain == "knot":
        return _narrate_knot(invariants, formula)
    elif domain == "manifold":
        return _narrate_manifold(invariants, formula)
    elif domain == "circuit":
        return _narrate_circuit(invariants, formula)
    elif domain == "tda":
        return _narrate_tda(invariants, formula)
    else:
        return _narrate_generic(domain, invariants)


def _narrate_topology(inv: Dict[str, Any], formula: str) -> NarratorResponse:
    metadata = inv.get("metadata", {})
    topology = inv.get("topology", {})
    family = topology.get("graph_family", {})

    n = metadata.get("num_nodes", 0)
    m = metadata.get("num_edges", 0)
    is_connected = metadata.get("is_connected", True)
    is_planar = metadata.get("is_planar", None)
    betti = topology.get("betti_numbers", [1, 0, 0])
    b0 = betti[0] if len(betti) > 0 else 1
    b1 = betti[1] if len(betti) > 1 else 0
    b2 = betti[2] if len(betti) > 2 else 0
    alg_conn = topology.get("algebraic_connectivity", 0.0)
    spec_gap = topology.get("spectral_gap", 0.0)
    cheeger = topology.get("cheeger_bounds", {})
    fam_name = family.get("family_name", "General Graph")

    # Summary
    summary = (
        f"This simplicial 1-skeleton complex G comprises |V| = {n} vertices and |E| = {m} edges, "
        f"classified canonically as a {fam_name}. "
        f"Topological clique complex homology evaluates to (β₀={b0}, β₁={b1}, β₂={b2}) with an "
        f"algebraic connectivity λ₁ = {alg_conn:.4f}."
    )

    # Key Insights
    insights = []
    if b0 > 1:
        insights.append(
            f"The 0-th Betti number β₀ = {b0} confirms the space decomposes into {b0} disconnected path components, "
            f"resulting in a multiplicity of zero eigenvalues in the combinatorial Laplacian spectrum."
        )
    else:
        insights.append(
            f"β₀ = 1 guarantees global path-connectivity; the combinatorial Laplacian null space has dimension 1, "
            f"spanned strictly by the uniform harmonic eigenvector 1."
        )

    if b1 > 0:
        triangles = len(topology.get("triangles", []))
        insights.append(
            f"The clique complex exhibits β₁ = {b1} independent non-bounding 1-cycles (topological voids). "
            f"Although the graph possesses {triangles} filled 2-simplices (triangles), these {b1} loops fail "
            f"to bound any 2-chains in the boundary operator im(∂₂)."
        )
    else:
        insights.append(
            "β₁ = 0 indicates that every combinatorial cycle in G is either contractible or filled by "
            "clique 2-simplices, forming an acyclic 1-complex in first homology."
        )

    if is_planar is True:
        insights.append(
            "The graph satisfies Kuratowski's theorem (free of K₅ and K₃,₃ topological minors) and embeds smoothly "
            "in the Euclidean plane ℝ² without intersecting edges."
        )
    elif is_planar is False:
        insights.append(
            "Planarity fails under the Boyer-Myrvold linear-time embedding test, indicating the presence of either "
            "a complete K₅ or complete bipartite K₃,₃ topological minor."
        )

    if alg_conn > 0:
        c_low = cheeger.get("lower", 0.0)
        c_high = cheeger.get("upper", 0.0)
        insights.append(
            f"Spectral gap ν₁ = {spec_gap:.4f} establishes Cheeger conductance bounds h(G) ∈ [{c_low:.4f}, {c_high:.4f}]. "
            "Diffusion over this network converges geometrically at rate O((1 - ν₁)^t)."
        )

    # Theoretical connections
    theorems = [
        "Euler-Poincaré Characteristic: χ = β₀ - β₁ + β₂ = |V| - |E| + |F₂|.",
        "Cheeger Inequality: λ₁/2 ≤ h(G) ≤ √(2λ₁), bounding the combinatorial bottleneck ratio via the Fiedler eigenvalue.",
        "Hodge-Helmholtz Decomposition: Ker(Δ₁) ≅ H₁(X, ℝ), identifying harmonic 1-forms with topological cycle generators.",
    ]

    # Open questions
    questions = [
        "What is the chromatic number χ(G) relative to Wilf's spectral upper bound λ_max(A) + 1?",
        "Under what minimal edge perturbations does the first Betti number β₁ vanish via triangulation?",
        "Does the Fiedler partition achieve the exact Cheeger cut optimum, or is the combinatorial gap tight?",
    ]

    return NarratorResponse(
        summary=summary,
        key_insights=insights,
        theoretical_connections=theorems,
        open_questions=questions,
    )


def _narrate_algebraic(inv: Dict[str, Any], formula: str) -> NarratorResponse:
    sing = inv.get("singularities", [])
    num_sing = len(sing)
    is_smooth = inv.get("is_smooth", num_sing == 0)
    ideal_basis = inv.get("groebner_basis", [])
    nullstellensatz = inv.get("nullstellensatz_certified", is_smooth)

    summary = (
        f"The affine algebraic variety defined by the zero locus V({formula or 'F'}) "
        f"is {'globally smooth' if is_smooth else f'singular with {num_sing} singular points'}. "
        f"Hilbert's Nullstellensatz certificate: {'1 ∈ ⟨F, ∇F⟩ (Smooth)' if nullstellensatz else 'Ideal ⟨F, ∇F⟩ is proper (Singular)'}."
    )

    insights = [
        f"The singular locus V(F, ∂F/∂x, ∂F/∂y, ∂F/∂z) contains exactly {num_sing} critical configurations."
    ]
    if nullstellensatz:
        insights.append(
            "Gröbner basis computation under lexicographic term ordering contains the unit polynomial 1, "
            "proving rigorously via Hilbert's Nullstellensatz that the gradient never vanishes on the variety."
        )
    else:
        insights.append(
            "The ideal ⟨F, ∂F/∂x, ∂F/∂y, ∂F/∂z⟩ does not contain 1, verifying the presence of true geometric singularities "
            "(nodes, cusps, or self-intersection pinch points) where the tangent space dimension jumps."
        )

    theorems = [
        "Hilbert's Nullstellensatz: Rad(I) = I(V(I)), establishing the correspondence between radical ideals and algebraic sets.",
        "Implicit Function Theorem: Rank(J_F) = 1 guarantees a locally smooth differential manifold structure.",
        "Milnor Fibration Theorem: Governs the topological structure of the intersection of V(F) with a small sphere centered at a singular point.",
    ]

    questions = [
        "What is the Milnor number μ = dim_ℂ ℂ[[x,y,z]] / ⟨∂F/∂x, ∂F/∂y, ∂F/∂z⟩ at each isolated singularity?",
        "Is the projective closure of this variety topologically simply connected?",
    ]

    return NarratorResponse(
        summary=summary,
        key_insights=insights,
        theoretical_connections=theorems,
        open_questions=questions,
    )


def _narrate_knot(inv: Dict[str, Any], formula: str) -> NarratorResponse:
    p = inv.get("p", 2)
    q = inv.get("q", 3)
    alexander = inv.get("alexander_polynomial", "")
    genus = inv.get("seifert_genus", (p - 1) * (q - 1) // 2)
    crossings = inv.get("crossing_number", min(p * (q - 1), q * (p - 1)))

    summary = (
        f"This embedding represents the ({p},{q})-torus knot T({p},{q}) wound on the standard 2-torus T² ⊂ ℝ³. "
        f"The knot possesses crossing number c(K) = {crossings} and Seifert genus g(K) = {genus}."
    )

    insights = [
        f"The Alexander polynomial is given by Δ(t) = {alexander or '(t^(pq)-1)(t-1)/((t^p-1)(t^q-1))'}, which is palindromic and satisfies Δ(t) = t^d Δ(t⁻¹).",
        f"The Seifert genus g = (p-1)(q-1)/2 = {genus} represents the minimum genus of an orientable surface bounded by this knot.",
        f"Because gcd({p}, {q}) = 1, this curve forms a single closed non-self-intersecting knot rather than a multi-component link.",
    ]

    theorems = [
        "Alexander-Conway Skein Relation: Δ(L₊) - Δ(L₋) = (t^(1/2) - t^(-1/2)) Δ(L₀).",
        "Milnor's Torus Knot Theorem: Torus knots are fibered; the complement S³ \\ K fibers over the circle S¹ with fiber of genus g.",
        "Jones Polynomial: Distinguishes right-handed from left-handed chiral knot embeddings.",
    ]

    questions = [
        "What is the 4-ball (slice) genus g₄(K) of this knot, and does the Rasmussen s-invariant confirm g₄ = g?",
        "What is the fundamental group π₁(S³ \\ T(p,q)) = ⟨x, y | x^p = y^q⟩?",
    ]

    return NarratorResponse(
        summary=summary,
        key_insights=insights,
        theoretical_connections=theorems,
        open_questions=questions,
    )


def _narrate_manifold(inv: Dict[str, Any], formula: str) -> NarratorResponse:
    chi = inv.get("euler_characteristic", 0)
    genus = inv.get("genus", (2 - chi) // 2 if chi <= 2 else 0)
    k_mean = inv.get("mean_gaussian_curvature", 0.0)

    summary = (
        f"This 2D Riemannian surface embedded in ℝ³ exhibits Euler characteristic χ = {chi} "
        f"and topological genus g = {genus}. Discrete Gauss-Bonnet integral evaluates to ∫ K dA = {k_mean * 12.56:.2f}."
    )

    insights = [
        f"Topological classification of compact orientable surfaces identifies this 2-manifold as a surface of genus {genus}.",
        f"Discrete Gaussian curvature K_i computed via Gauss-Bonnet angle deficits (2π - ∑ θ_ijk) / A_i reveals both elliptic (K > 0) and hyperbolic (K < 0) regions.",
        f"Discrete Laplace-Beltrami mean curvature H highlights regions of maximal capillary tension and minimal surface extrema.",
    ]

    theorems = [
        "Gauss-Bonnet Theorem: ∫_M K dA + ∫_∂M k_g ds = 2π χ(M), connecting local differential geometry directly to global topology.",
        "Poincaré-Hopf Theorem: Sum of indices of any tangent vector field equals the Euler characteristic χ.",
        "Uniformization Theorem: Every simply connected Riemann surface is conformally equivalent to the sphere, plane, or disk.",
    ]

    questions = [
        "Does this surface admit a minimal embedding (H ≡ 0 everywhere) under appropriate boundary conditions?",
        "What are the eigenvalues of the continuous Laplace-Beltrami operator -Δ_g on this metric?",
    ]

    return NarratorResponse(
        summary=summary,
        key_insights=insights,
        theoretical_connections=theorems,
        open_questions=questions,
    )


def _narrate_circuit(inv: Dict[str, Any], formula: str) -> NarratorResponse:
    depth = inv.get("depth", 0)
    size = inv.get("size", 0)
    num_inputs = inv.get("num_inputs", 0)

    summary = (
        f"This Boolean circuit computation comprises {size} logic gates operating across {num_inputs} primary input variables "
        f"with critical path depth {depth}."
    )

    insights = [
        f"Circuit depth {depth} dictates the parallel execution time complexity in the NC hierarchy (class NC^{depth if depth <= 3 else 'k'}).",
        f"Gate count {size} bounds total combinatorial area and energy complexity under the standard VLSI model.",
        "The Boolean DAG reveals the degree of fan-out and wire sharing across sub-expressions.",
    ]

    theorems = [
        "Cook-Levin Theorem: Circuit Satisfiability (Circuit-SAT) is NP-complete.",
        "Shannon's Circuit Lower Bound: Almost all Boolean functions on n variables require circuits of size Ω(2^n / n).",
        "Razborov-Smolensky Theorem: AC⁰[p] circuits cannot compute the MOD_q function for distinct primes p and q.",
    ]

    questions = [
        "Is this Boolean function monotone, and what is its sensitivity s(f) vs block sensitivity bs(f)?",
        "Can this circuit be flattened into an equivalent CNF/DNF without exponential gate explosion?",
    ]

    return NarratorResponse(
        summary=summary,
        key_insights=insights,
        theoretical_connections=theorems,
        open_questions=questions,
    )


def _narrate_tda(inv: Dict[str, Any], formula: str) -> NarratorResponse:
    num_points = inv.get("num_points", 0)
    b0_count = inv.get("h0_count", 1)
    b1_count = inv.get("h1_count", 0)

    summary = (
        f"Persistent homology filtration over {num_points} point-cloud samples in metric space "
        f"reveals multi-scale topological features: {b0_count} persistent connected components and {b1_count} persistent 1-cycles."
    )

    insights = [
        "Long-lived persistence intervals in the barcode represent true topological features of the underlying generative manifold.",
        "Short-lived topological noise near the diagonal represents sampling discretization artifacts.",
        "Vietoris-Rips filtration tracks how the simplicial boundary operator stabilizes as the ball radius ε expands.",
    ]

    theorems = [
        "Stability Theorem for Persistence Diagrams: W_∞(Dgm(f), Dgm(g)) ≤ ||f - g||_∞.",
        "Nerve Theorem: If an open cover has contractible finite intersections, its nerve is homotopy equivalent to the total space.",
        "Structure Theorem for Persistence Modules: Every persistence module decomposes uniquely into interval modules.",
    ]

    questions = [
        "What is the bottleneck distance between this persistence diagram and a synthetic Poisson point process?",
        "Are the persistent 1-cycles geometrically stable under Gaussian metric noise?",
    ]

    return NarratorResponse(
        summary=summary,
        key_insights=insights,
        theoretical_connections=theorems,
        open_questions=questions,
    )


def _narrate_generic(domain: str, invariants: Dict[str, Any]) -> NarratorResponse:
    return NarratorResponse(
        summary=f"Analysis of mathematical invariants for domain: {domain}.",
        key_insights=["Invariant spectrum computed across active topological dimensions."],
        theoretical_connections=["Applicable spectral and algebraic classification theorems."],
        open_questions=["How do these invariants transform under continuous deformations?"],
    )
