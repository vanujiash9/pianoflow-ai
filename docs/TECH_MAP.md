# PianoFlow — Tech Map for Learning Through the Project

This file maps each technology to the exact place where it is used. The goal is to make the repo useful as a learning project, not just generated code.

## 1. FastAPI — API boundary

Start here:

```text
backend/app/main.py
backend/app/api/router.py
backend/app/api/routes/
backend/app/api/deps.py
```

What to learn:

- `APIRouter`
- `Depends`
- `Query`
- `response_model`
- HTTP status codes
- exception handlers
- Swagger/OpenAPI

Swagger is at `http://localhost:8000/docs`.

## 2. Pydantic — request/response contracts

```text
backend/app/schemas/
```

What to learn:

- Separate create/update/read schemas.
- `extra="forbid"` catches unexpected input fields.
- Enum/date/UUID still parse cleanly from JSON sent by Swagger.
- AI chat request/response is also typed.

## 3. SQLAlchemy + Supabase PostgreSQL — operational data

```text
backend/app/core/database.py
backend/app/models/
backend/app/repositories/
```

Supabase is used as managed PostgreSQL; SQLAlchemy is the application-side ORM.

Data model:

```text
Customer
  ├── Sale ── Piano
  │      └── Warranty
  └── ServiceRecord ── Piano

Lead
AIConversation ── AIMessage
```

Important lesson: customer/piano/warranty data is structured data. Query it with SQL/tools, not RAG.

## 4. Service layer — business rules

```text
backend/app/services/
```

Examples:

- `SaleService`: selling a piano changes its status to `sold` and creates warranty dates in one transaction.
- `MaintenanceService`: prevents attaching a service record to a piano that the selected customer never bought.
- `DashboardService`: aggregates small operational metrics in Python/SQL without involving the LLM.

This is where domain rules belong; routes stay thin.

## 5. Repository pattern — database access

```text
backend/app/repositories/
```

Repositories only deal with persistence/query concerns.

Example:

```text
route -> service -> repository -> SQLAlchemy -> Supabase PostgreSQL
```

This keeps AI/tool code from directly scattering SQL queries everywhere.

## 6. OpenAI-compatible router/gateway

```text
backend/app/ai/agent.py
backend/app/services/ai_service.py
```

Config:

```env
LLM_ENABLED=true
LLM_BASE_URL=https://your-router.example.com/v1
LLM_API_KEY=...
LLM_MODEL=...
```

The project uses the OpenAI-compatible client but changes `base_url` to your router/gateway.

## 7. Tool calling — first new AI concept to study

```text
backend/app/ai/tools.py
```

Current tools:

```text
find_customer
get_customer_history
search_inventory
get_shop_overview
get_attention_list
```

Study this flow:

```text
User question
  -> LLM decides which tool is needed
  -> FastAPI/SQLAlchemy executes real code
  -> tool result returns to LLM
  -> LLM writes the final response
```

The LLM never receives permission to mutate shop data in V1.

## 8. LangGraph — orchestration

```text
backend/app/ai/agent.py
```

The graph intentionally stays small:

```text
START
  -> reason
  -> if tool call: tools
  -> reason again
  -> END
```

Study:

- `StateGraph`
- state
- node
- conditional edge
- looping after a tool result

The file also has a manual fallback loop so the non-AI app remains understandable even before LangGraph is installed.

## 9. Conversation memory

```text
backend/app/models/ai_conversation.py
backend/app/models/ai_message.py
backend/app/repositories/ai_repository.py
```

The API returns a `conversation_id`.

Reuse it for the next request:

```text
"Tìm anh Minh"
"Anh ấy mua đàn nào?"
"Cây đó còn bảo hành không?"
```

Recent user/assistant messages are loaded from the database and sent back to the agent.

## 10. React + TypeScript — shop UI

```text
frontend/src/pages/
frontend/src/components/
frontend/src/lib/api.ts
```

Pages are designed around shop work rather than AI demos:

- dashboard
- global customer/piano search
- customer profile
- piano inventory
- sale + automatic warranty
- warranty lookup
- maintenance history
- lead follow-up
- AI assistant

## 11. Recharts — small-data dashboard

```text
frontend/src/pages/DashboardPage.tsx
```

Only one operational chart is shown by default: number of pianos sold per month.

The dashboard avoids filling the screen with meaningless charts when the shop has little data.

## 12. Docker

```text
backend/Dockerfile
frontend/Dockerfile
docker-compose.yml
```

Learn:

- image vs container
- build context
- environment variables
- exposing ports
- starting frontend/backend together

## 13. CI

```text
.github/workflows/ci.yml
```

Backend pipeline:

```text
install -> Ruff -> Pytest
```

Frontend pipeline:

```text
install -> TypeScript/Vite build
```

Study CI only after you can run both apps locally.

## 14. Tests

```text
backend/tests/unit/
backend/tests/integration/
```

Current tests cover:

- health endpoint
- customer create/search
- sale business rule
- automatic warranty creation
- dashboard metrics
- AI tools reading real DB records
- AI endpoint behavior while LLM is disabled

## 15. What is deliberately NOT implemented yet

These are good follow-up learning phases after V1 works with real shop data:

- Supabase Auth + RLS for real owner/staff security.
- pgvector RAG for manuals and warranty/maintenance knowledge.
- hybrid search and reranking.
- human-in-the-loop AI write actions.
- scheduled reminder workers.
- LangSmith/Langfuse observability.
- automated AI-agent evaluation dataset.

Do not add all of them at once. Make V1 boring and reliable first, then introduce one AI engineering concept at a time.
