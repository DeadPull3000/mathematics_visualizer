# Visual Mathematical Discovery Engine

> Discover new theorems by visualising the latent structure of mathematical objects.

A full-stack application that accepts mathematical objects (graphs, knots, Boolean circuits), computes their **topological and geometric invariants** via a Python backend, and renders the resulting structure in an interactive 3D frontend — making deep mathematics accessible to students while remaining rigorous for research mathematicians.

---

## Architecture

```
math-discovery-engine/
├── backend/          # Python 3.13 · FastAPI · NetworkX · NumPy
└── frontend/         # Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui
```

---

## Quick Start

### 1 — Backend

```bash
cd math-discovery-engine/backend

# Create and activate the virtual environment
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server (hot-reload)
uvicorn main:app --reload --port 8000
```

API docs available at **[http://localhost:8000/docs](http://localhost:8000/docs)**

Health check: `GET http://localhost:8000/health`

### 2 — Frontend

```bash
cd math-discovery-engine/frontend

# Install Node dependencies
npm install

# Start the Next.js dev server
npm run dev
```

Application available at **[http://localhost:3000](http://localhost:3000)**

---

## API Reference

### `GET /health`
Returns service liveness and library versions.

```json
{
  "status": "ok",
  "service": "math-discovery-engine",
  "version": "0.1.0",
  "libraries": { "networkx": "3.4.2", "numpy": "2.1.3" }
}
```

### `POST /api/process-object`

**Request**
```json
{
  "type": "graph",
  "data": {
    "nodes": [0, 1, 2, 3, 4],
    "edges": [[0,1],[1,2],[2,3],[3,4],[4,0],[0,2]]
  },
  "parameters": {
    "max_filtration_radius": 1.5,
    "gnn_layers": 3
  }
}
```

**Response**
```json
{
  "request_id": "uuid",
  "status": "success",
  "object_type": "graph",
  "nodes": [...],
  "edges": [...],
  "invariants": [
    { "name": "Vertices |V|", "value": 5, "description": "..." },
    { "name": "β₁ (Betti-1)", "value": 2, "description": "..." }
  ],
  "computation_time_ms": 4.231,
  "message": "Successfully computed 10 invariants for graph."
}
```

Supported `type` values: `graph` · `knot` · `circuit`

---

## Development

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, deployable |
| `feat/*` | Feature work — merged via PR |
| `fix/*` | Bug fixes |

### Commit Convention (Conventional Commits)

```
feat:   New feature
fix:    Bug fix
chore:  Tooling / dependency updates
docs:   Documentation only
style:  Formatting (no logic change)
refactor: Code restructure (no behaviour change)
test:   Adding or updating tests
```

---

## Roadmap

- [x] Step 1 — Scaffolding (backend API + frontend UI shell)
- [ ] Step 2 — Interactive graph editor (drag-and-drop node placement)
- [ ] Step 3 — 3D force-directed visualisation (Three.js / react-three-fiber)
- [ ] Step 4 — Persistent homology pipeline (Gudhi / Ripser)
- [ ] Step 5 — GNN-based structure learning
- [ ] Step 6 — Theorem suggestion engine

---

## License

MIT © 2025 Visual Mathematical Discovery Engine contributors
