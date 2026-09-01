# PianoFlow AI

PianoFlow AI is a small-shop management app for piano stores. It tracks customers, inventory, sales, warranties, maintenance, leads, and an internal AI assistant.

## What this repo contains

- `frontend/` — React + TypeScript app
- `backend/` — FastAPI API, SQLAlchemy, Alembic
- `docs/` — architecture and deployment notes

## Quick start

### Backend

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment

See [ENV.example](ENV.example) for a clean template.

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md).

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Notes

- Keep secrets out of git.
- Use migrations for schema changes.
- Keep reusable code in shared backend utilities, API helpers, and UI primitives.
