import math
import random
import numpy as np
from ripser import ripser
from models import TDARequest, TDAResponse


def generate_point_cloud(shape: str, num_points: int, noise_level: float) -> np.ndarray:
    """
    Generate an N x 3 point cloud scaled by 50 for the 3D visualizer.
    
    Supported shapes:
    - 'noisy_circle': Points sampled along a 2D circle with Gaussian noise.
    - 'noisy_sphere': Points sampled across a 3D sphere using spherical coordinates with Gaussian noise.
    - 'random_noise': Points uniformly distributed in a 3D bounding box.
    """
    shape_norm = (shape or "").lower().strip()
    noise_scale = max(0.0, float(noise_level))

    if shape_norm in ("noisy_circle", "circle"):
        theta = np.random.uniform(0.0, 2.0 * math.pi, size=num_points)
        x = np.cos(theta)
        y = np.sin(theta)
        z = np.zeros(num_points)
        if noise_scale > 0:
            x += np.random.normal(scale=noise_scale, size=num_points)
            y += np.random.normal(scale=noise_scale, size=num_points)
            z += np.random.normal(scale=noise_scale, size=num_points)
        points = np.column_stack([x, y, z])
    elif shape_norm in ("noisy_sphere", "sphere"):
        u = np.random.uniform(0.0, 1.0, size=num_points)
        v = np.random.uniform(0.0, 1.0, size=num_points)
        theta = 2.0 * math.pi * u
        phi = np.arccos(2.0 * v - 1.0)
        x = np.sin(phi) * np.cos(theta)
        y = np.sin(phi) * np.sin(theta)
        z = np.cos(phi)
        if noise_scale > 0:
            x += np.random.normal(scale=noise_scale, size=num_points)
            y += np.random.normal(scale=noise_scale, size=num_points)
            z += np.random.normal(scale=noise_scale, size=num_points)
        points = np.column_stack([x, y, z])
    elif shape_norm in ("random_noise", "noise", "box"):
        points = np.random.uniform(-1.0, 1.0, size=(num_points, 3))
    else:
        raise ValueError(
            f"Unsupported shape '{shape}'. Expected 'noisy_circle', 'noisy_sphere', or 'random_noise'."
        )

    # Scale coordinates by 50 for the visualizer
    return points * 50.0


def compute_persistent_homology(points: np.ndarray) -> dict:
    """
    Compute persistent homology barcodes up to dimension 1 using Vietoris-Rips filtration.
    Replaces infinite death times with a finite multiple of the maximum finite death time.
    """
    diagrams = ripser(points, maxdim=1)["dgms"]
    
    # Collect all finite death times to compute a finite replacement for np.inf
    finite_deaths = []
    for dgm in diagrams[:2]:
        if len(dgm) > 0:
            fin = dgm[~np.isinf(dgm[:, 1]), 1]
            if len(fin) > 0:
                finite_deaths.extend(fin)

    max_death = float(np.max(finite_deaths)) if finite_deaths else 10.0
    inf_replacement = float(max_death * 1.2) if max_death > 0 else 10.0

    # Process H0 (0D components)
    h0 = np.array(diagrams[0], dtype=float, copy=True)
    if len(h0) > 0:
        h0[np.isinf(h0)] = inf_replacement

    # Process H1 (1D loops)
    if len(diagrams) > 1 and len(diagrams[1]) > 0:
        h1 = np.array(diagrams[1], dtype=float, copy=True)
        h1[np.isinf(h1)] = inf_replacement
    else:
        h1 = np.empty((0, 2), dtype=float)

    return {
        "H0": h0.tolist(),
        "H1": h1.tolist(),
    }


def process_tda(request: TDARequest) -> dict:
    """
    Generates point cloud according to the request, computes persistence barcodes,
    and returns a dictionary matching TDAResponse schema.
    """
    points = generate_point_cloud(
        shape=request.shape,
        num_points=request.num_points,
        noise_level=request.noise_level,
    )
    barcodes = compute_persistent_homology(points)
    nodes = [
        {
            "id": i,
            "fx": float(points[i, 0]),
            "fy": float(points[i, 1]),
            "fz": float(points[i, 2]),
        }
        for i in range(len(points))
    ]
    return {
        "nodes": nodes,
        "barcodes": barcodes,
    }
