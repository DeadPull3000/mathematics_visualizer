"""
Tropical Geometry & Newton Polygon Service
==========================================
Analyzes algebraic plane curves and min-plus tropical polynomials:
- Newton Polygon: Convex hull of monomial exponents in R^2
- Genus via Baker's / Pick's Theorem: g = Area - B/2 + 1
- Interior lattice points corresponding to independent cycles of the tropical curve
- Corner locus (tropical curve skeleton) in min-plus algebra
"""

from __future__ import annotations
import math
import logging
from typing import Dict, Any, List
import sympy as sp
import numpy as np
from scipy.spatial import ConvexHull

log = logging.getLogger("math-engine.services.tropical")


def analyze_tropical_curve(formula_str: str) -> Dict[str, Any]:
    """
    Compute the Newton polygon, Pick's theorem genus, interior lattice points,
    and tropical corner locus for an algebraic curve P(x, y) = 0.
    """
    x, y = sp.symbols("x y")
    clean_formula = formula_str.strip().replace("= 0", "").strip()

    try:
        expr = sp.sympify(clean_formula)
        poly = sp.Poly(expr, x, y)
    except Exception as e:
        log.warning(f"Sympy parse error on '{formula_str}': {e}")
        return {
            "formula": formula_str,
            "monomials": [],
            "newton_polygon_vertices": [],
            "area": 0.0,
            "boundary_points_count": 0,
            "interior_lattice_points": [],
            "tropical_genus": 0,
            "corner_vertices": [],
            "latex_summary": r"\text{Invalid polynomial formula}",
            "explanation": f"Failed to parse polynomial: {e}",
        }

    raw_monoms = poly.monoms()
    raw_coeffs = poly.coeffs()

    monomials_list = []
    points = []
    terms_for_tropical = []

    for monom, coeff in zip(raw_monoms, raw_coeffs):
        i, j = int(monom[0]), int(monom[1])
        c_val = float(coeff) if coeff.is_real else 1.0
        monomials_list.append({
            "x_pow": i,
            "y_pow": j,
            "coeff": round(c_val, 4),
        })
        points.append([i, j])
        # In tropical min-plus: valuation can be taken as 0 for integer exponents or log(|c|)
        terms_for_tropical.append((i, j, 0.0))

    pts_arr = np.array(points, dtype=int)

    if len(pts_arr) < 3:
        # Collinear or monomial
        return {
            "formula": formula_str,
            "monomials": monomials_list,
            "newton_polygon_vertices": points,
            "area": 0.0,
            "boundary_points_count": len(points),
            "interior_lattice_points": [],
            "tropical_genus": 0,
            "corner_vertices": [],
            "latex_summary": r"\Delta(P) \text{ is degenerate (dim } < 2)",
            "explanation": "Polynomial has fewer than 3 non-collinear monomials. Newton polygon is degenerate with genus 0.",
        }

    # Convex Hull of exponents
    try:
        hull = ConvexHull(pts_arr)
        # ConvexHull vertices in 2D are ordered counterclockwise!
        hull_indices = list(hull.vertices)
        ordered_hull = pts_arr[hull_indices].tolist()
    except Exception:
        # If collinear
        return {
            "formula": formula_str,
            "monomials": monomials_list,
            "newton_polygon_vertices": points,
            "area": 0.0,
            "boundary_points_count": len(points),
            "interior_lattice_points": [],
            "tropical_genus": 0,
            "corner_vertices": [],
            "latex_summary": r"\Delta(P) \text{ has zero 2D area}",
            "explanation": "Monomial exponents lie along a 1D line; tropical genus is 0.",
        }

    n_verts = len(ordered_hull)

    # Shoelace formula for polygon area
    area2 = 0
    boundary_count = 0
    for i in range(n_verts):
        x1, y1 = ordered_hull[i]
        x2, y2 = ordered_hull[(i + 1) % n_verts]
        area2 += (x1 * y2 - x2 * y1)
        boundary_count += math.gcd(abs(x2 - x1), abs(y2 - y1))

    area = abs(area2) / 2.0
    tropical_genus = int(round(area - (boundary_count / 2.0) + 1.0))

    # Identify exact interior lattice points using cross products
    min_x = min(p[0] for p in ordered_hull)
    max_x = max(p[0] for p in ordered_hull)
    min_y = min(p[1] for p in ordered_hull)
    max_y = max(p[1] for p in ordered_hull)

    interior_points = []
    for test_x in range(min_x, max_x + 1):
        for test_y in range(min_y, max_y + 1):
            strictly_interior = True
            for i in range(n_verts):
                x1, y1 = ordered_hull[i]
                x2, y2 = ordered_hull[(i + 1) % n_verts]
                # Cross product of edge vector and point vector
                cross = (x2 - x1) * (test_y - y1) - (y2 - y1) * (test_x - x1)
                # Ensure orientation matches CCW (cross > 0)
                if cross <= 0:
                    strictly_interior = False
                    break
            if strictly_interior:
                interior_points.append([test_x, test_y])

    # Tropical curve corner locus: triple points where 3 terms achieve min
    corner_vertices = []
    n_terms = len(terms_for_tropical)
    for a in range(n_terms):
        for b in range(a + 1, n_terms):
            for c in range(b + 1, n_terms):
                i1, j1, w1 = terms_for_tropical[a]
                i2, j2, w2 = terms_for_tropical[b]
                i3, j3, w3 = terms_for_tropical[c]
                # Linear system:
                # (i1 - i2) X + (j1 - j2) Y = w2 - w1
                # (i1 - i3) X + (j1 - j3) Y = w3 - w1
                M = np.array([[i1 - i2, j1 - j2], [i1 - i3, j1 - j3]], dtype=float)
                rhs = np.array([w2 - w1, w3 - w1], dtype=float)
                if abs(np.linalg.det(M)) > 1e-5:
                    sol = np.linalg.solve(M, rhs)
                    X, Y = float(sol[0]), float(sol[1])
                    val = w1 + i1 * X + j1 * Y
                    # Check if val is minimum among all terms
                    all_vals = [w + i * X + j * Y for i, j, w in terms_for_tropical]
                    if abs(val - min(all_vals)) < 1e-4:
                        corner_vertices.append({
                            "x": round(X, 3),
                            "y": round(Y, 3),
                            "terms": [a, b, c],
                        })

    latex_summary = (
        rf"\text{{Area}}(\Delta) = {area:g}, \quad "
        rf"B = {boundary_count}, \quad "
        rf"g_{{\text{{trop}}}} = {tropical_genus}"
    )

    if tropical_genus == 1:
        genus_desc = "an elliptic curve (1 bounded tropical cycle / hole)."
    elif tropical_genus == 0:
        genus_desc = "a rational curve (tree-like tropical amoeba with 0 bounded cycles)."
    else:
        genus_desc = f"a higher-genus curve with {tropical_genus} independent cycles dual to interior lattice points."

    explanation = (
        f"The Newton polygon Δ(P) has {n_verts} extremal vertices, enclosing an area of {area:g} with "
        f"{boundary_count} boundary lattice points. By Pick's theorem / Baker's formula, the tropical curve has genus "
        f"g = {tropical_genus}, characterizing {genus_desc} "
        f"Interior lattice points: {interior_points if interior_points else 'None'}."
    )

    return {
        "formula": formula_str,
        "monomials": monomials_list,
        "newton_polygon_vertices": ordered_hull,
        "area": area,
        "boundary_points_count": boundary_count,
        "interior_lattice_points": interior_points,
        "tropical_genus": tropical_genus,
        "corner_vertices": corner_vertices[:10],
        "latex_summary": latex_summary,
        "explanation": explanation,
    }
