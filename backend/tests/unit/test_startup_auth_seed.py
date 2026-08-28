from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_app_creates_without_startup_seed(monkeypatch):
    monkeypatch.setattr(app, "router", app.router)
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_route_still_exists():
    with TestClient(app) as client:
        response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "PianoFlow API"
