# PianoFlow AI

A small-shop piano management system designed for **shop owners and staff**, with an internal AI assistant for natural-language lookup.

The product deliberately stays operational-first: customer records, piano serials, sales-to-warranty linkage, service history, follow-ups and a compact dashboard. AI is additive, not required for normal shop operations.

## Main features

- **Dashboard:** pianos currently in shop, pianos sold this month, total customers, items needing attention, 6-month sales count chart.
- **Customers:** search by name/phone, store notes and contact details.
- **Pianos:** brand/model/serial/year/condition/status.
- **Sales:** link one customer to one exact piano; automatically mark the piano as sold and create warranty dates.
- **Warranty:** active/expiring/expired status derived from dates.
- **Maintenance:** service history and next-service reminders.
- **Leads:** lightweight follow-up list for people who asked about a piano but have not bought yet.
- **AI Assistant:** read-only internal assistant using an OpenAI-compatible gateway, tool calling, persisted conversation history, and LangGraph orchestration when installed.
- **Swagger:** every backend endpoint is testable at `/docs`.

## Architecture

```text
React + TypeScript
        |
        v
FastAPI routes
        |
        v
Service layer
        |
        +------> AI Agent (OpenAI-compatible gateway + LangGraph)
        |
        v
Repository layer
        |
        v
SQLAlchemy -> Supabase PostgreSQL
```

Backend follows the project style used in the user's other FastAPI work:

```text
backend/app/
├── api/
│   ├── deps.py
│   ├── router.py
│   └── routes/
├── ai/
├── core/
├── models/
├── repositories/
├── schemas/
├── services/
└── main.py
```

## 1. Run backend locally

Requires Python 3.12+.

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\\Scripts\\activate
pip install -e '.[dev]'
python -m scripts.seed
uvicorn app.main:app --reload --port 8000
```

Swagger:

```text
http://localhost:8000/docs
```

Health:

```text
GET http://localhost:8000/api/v1/health
```

### With `uv`

If you prefer the same workflow as your other projects:

```bash
cd backend
uv venv
uv pip install -e '.[dev]'
python -m scripts.seed
uvicorn app.main:app --reload --port 8000
```

## 2. Connect Supabase

PianoFlow uses Supabase as **managed PostgreSQL** through SQLAlchemy. In Supabase, open **Connect** and copy a database connection string.

For an IPv4-only environment, use the Supabase pooler. Convert the scheme for SQLAlchemy/psycopg:

```env
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres
```

For local SQLite development, you can keep:

```env
AUTO_CREATE_TABLES=true
```

For Supabase or any deployed PostgreSQL database, set:

```env
AUTO_CREATE_TABLES=false
```

Then run Alembic migrations explicitly when schema changes.

## 3. Configure your OpenAI-compatible router/gateway

The normal management system works without AI. To enable the assistant:

```env
LLM_ENABLED=true
LLM_BASE_URL=https://your-router.example.com/v1
LLM_API_KEY=your-key
LLM_MODEL=your-model-name
LLM_TIMEOUT_SECONDS=45
```

The agent currently exposes **read-only tools**:

- `find_customer`
- `get_customer_history`
- `search_inventory`
- `get_shop_overview`
- `get_attention_list`

This is intentional: data mutations stay in explicit UI forms in V1, so the model cannot accidentally change customer/shop data.

## 4. Run frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The default backend URL is `http://localhost:8000/api/v1`.

## 5. Seed data

The seed is deliberately small: a handful of customers, pianos, sales, warranties, services and leads.

```bash
cd backend
python -m scripts.seed
```

> `seed.py` resets the configured database. Do **not** run it against a real shop database after you start storing production data.

## 6. Test backend

```bash
cd backend
pytest -q
```

Covered examples:

- health endpoint
- customer create/search
- sale -> piano becomes sold
- sale -> warranty is created automatically
- dashboard operational metrics

## 7. Swagger test order

A simple manual flow:

1. `POST /api/v1/customers`
2. `POST /api/v1/pianos`
3. `POST /api/v1/sales`
4. `GET /api/v1/warranties`
5. `POST /api/v1/services`
6. `GET /api/v1/dashboard`
7. Enable LLM config, then `POST /api/v1/ai/chat`

Example AI request:

```json
{
  "message": "Anh Minh từng mua đàn gì?",
  "conversation_id": null
}
```

## 8. CI/CD

`.github/workflows/ci.yml` runs:

```text
Backend: install -> Ruff -> Pytest
Frontend: install -> TypeScript/Vite build
```

For deployment, a practical first setup is:

```text
Frontend -> Vercel
Backend  -> Railway / Render / VM container
Database -> Supabase PostgreSQL
```

Keep `LLM_API_KEY` and database credentials server-side only.

## 9. Next AI engineering extensions

Future work, not part of the current MVP:

1. RAG for manuals and shop policies.
2. pgvector-based retrieval.
3. LangGraph checkpoints.
4. Human confirmation for write actions.
5. Agent evaluation and tracing.
6. Background reminder jobs.
7. Role-based auth.

## Important design decision

Customer data, piano serials, warranties and service history stay in PostgreSQL and are queried with tools/SQL. RAG should only cover unstructured knowledge such as manuals and shop policies.
