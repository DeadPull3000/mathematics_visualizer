# Visual Mathematical Discovery Engine

An interactive, high-precision visual discovery workbench unifying pure mathematics, symbolic algebra, spectral graph theory, persistent homology, and conjecture synthesis.

---

## 🏛️ System Architecture

The engine is built on a modular decoupled architecture:

```
math-discovery-engine/
├── backend/                  # FastAPI 0.115+ Scientific Backend
│   ├── app.py                # Application factory & middleware
│   ├── main.py               # Server entrypoint (Uvicorn)
│   ├── config.py             # Centralized settings & limits
│   ├── models/               # Domain-split Pydantic v2 schemas
│   │   ├── base.py
│   │   ├── topology.py
│   │   ├── knots.py
│   │   ├── manifolds.py
│   │   ├── circuits.py
│   │   ├── algebraic.py
│   │   ├── batch.py
│   │   ├── tda.py
│   │   ├── wl.py
│   │   └── oracle.py
│   ├── routes/               # Modular REST endpoints
│   │   ├── health.py
│   │   ├── topology.py
│   │   ├── knots.py
│   │   ├── manifolds.py
│   │   ├── circuits.py
│   │   ├── algebraic.py
│   │   ├── batch.py
│   │   ├── tda.py
│   │   ├── wl.py
│   │   └── oracle.py
│   ├── services/             # Pure mathematical algorithms
│   └── tests/                # Automated Pytest suite
│
├── frontend/                 # Next.js 16 + React 19 + Three.js
│   ├── app/                  # Main discovery canvas & layout
│   ├── components/
│   │   ├── Microscope.tsx    # 3D interactive viewport
│   │   ├── RightPanel.tsx    # Invariants, spectral harmonics & analysis
│   │   ├── Sidebar.tsx       # Domain navigator
│   │   ├── dropzones/        # Modular mathematical input panels
│   │   └── results/          # Domain-specialized visualizers
│   ├── types/                # Domain models & state definitions
│   └── lib/                  # Backend API client
│
├── docker-compose.yml        # Orchestration for containerized execution
└── .env.example              # Environment variables template
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.x
- Python >= 3.11
- Docker (optional)

### Local Development

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Unix:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be accessible at: `http://localhost:8000/docs`

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Testing

### Backend Test Suite
```bash
cd backend
pytest tests/ -v
```

### Frontend Typecheck
```bash
cd frontend
npx tsc --noEmit
```

---

## 🐳 Docker Containerization

Run the full stack with Docker Compose:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Healthcheck: `http://localhost:8000/health`
