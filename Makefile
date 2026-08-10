.PHONY: backend-dev backend-seed backend-test frontend-dev

backend-dev:
	cd backend && uvicorn app.main:app --reload --port 8000

backend-seed:
	cd backend && python -m scripts.seed

backend-test:
	cd backend && pytest -q

frontend-dev:
	cd frontend && npm run dev
