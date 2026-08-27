from __future__ import annotations

from datetime import date

from sqlalchemy.exc import OperationalError

import pytest

from app.core.config import get_settings
from app.services.dashboard_service import DashboardService


def create_customer(client, phone="0909000001"):
    response = client.post(
        "/api/v1/customers",
        json={"name": "Khách Test", "phone": phone, "address": "TP.HCM", "notes": None},
    )
    assert response.status_code == 201, response.text
    return response.json()


def create_piano(client, serial="TEST-001", **overrides):
    payload = {
        "brand": "Kawai",
        "model": "KL-901",
        "serial_number": serial,
        "piano_type": "upright",
        "size_cm": 121,
        "pedal_count": 3,
        "purchase_price": "120000000",
        "retail_price": "180000000",
        "status": "available",
        "quantity": 1,
        "variant": "Màu đen",
        "arrival_date": date(2026, 8, 10).isoformat(),
        "color": "Đen",
        "condition": "used",
        "notes": None,
    }
    payload.update(overrides)
    response = client.post("/api/v1/pianos", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_db(client):
    response = client.get("/api/v1/health/db")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_db_returns_503_on_database_error(client, monkeypatch):
    def fail_connect():
        raise OperationalError("SELECT 1", {}, Exception("db down"))

    monkeypatch.setattr("app.api.routes.health.engine.connect", fail_connect)

    response = client.get("/api/v1/health/db")
    assert response.status_code == 503, response.text
    assert response.json() == {"detail": "Cơ sở dữ liệu tạm thời không khả dụng"}


def test_customer_create_and_search(client):
    customer = create_customer(client)
    response = client.get("/api/v1/customers", params={"search": "0909"})
    assert response.status_code == 200
    assert response.json()[0]["id"] == customer["id"]


def test_piano_create_and_read_inventory_fields(client):
    piano = create_piano(client)
    assert piano["piano_type"] == "upright"
    assert piano["serial_number"] == "TEST-001"
    assert piano["purchase_price"] == "120000000.00"
    assert piano["retail_price"] == "180000000.00"
    assert piano["quantity"] == 1
    assert piano["arrival_date"] == "2026-08-10"

    response = client.get(f"/api/v1/pianos/{piano['id']}")
    assert response.status_code == 200
    body = response.json()
    assert body["brand"] == "Kawai"
    assert body["piano_type"] == "upright"
    assert body["purchase_price"] == "120000000.00"


def test_piano_allows_null_serial_for_digital_stock(client):
    piano = create_piano(
        client,
        serial=None,
        piano_type="digital",
        quantity=3,
        serial_number=None,
        status="incoming",
    )
    assert piano["serial_number"] is None
    assert piano["piano_type"] == "digital"
    assert piano["quantity"] == 3
    assert piano["status"] == "incoming"


def test_piano_rejects_invalid_inventory_values(client):
    response = client.post(
        "/api/v1/pianos",
        json={
            "brand": "Kawai",
            "model": "KL-901",
            "serial_number": None,
            "piano_type": "digital",
            "size_cm": -1,
            "pedal_count": -1,
            "purchase_price": "-1",
            "retail_price": "-1",
            "status": "available",
            "quantity": 0,
            "variant": None,
            "arrival_date": None,
            "color": None,
            "condition": "used",
            "notes": None,
        },
    )
    assert response.status_code == 422


def test_piano_update_allows_new_fields(client):
    piano = create_piano(client)
    response = client.patch(
        f"/api/v1/pianos/{piano['id']}",
        json={
            "piano_type": "grand",
            "size_cm": 155,
            "pedal_count": 3,
            "purchase_price": "200000000",
            "retail_price": "320000000",
            "status": "paused",
            "quantity": 2,
            "variant": "Limited",
            "arrival_date": "2026-09-01",
            "serial_number": None,
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["piano_type"] == "grand"
    assert body["status"] == "paused"
    assert body["serial_number"] is None
    assert body["purchase_price"] == "200000000.00"
    assert body["quantity"] == 2


def test_warranty_sale_flow_reuses_customer_and_commits_atomic(client):
    customer = create_customer(client, phone="0907 111 222")
    piano = create_piano(client)

    response = client.post(
        "/api/v1/sales",
        json={
            "customer": {
                "name": "Khách Test Mới",
                "phone": "0907 111 222",
                "address": "Quận 12, TP.HCM",
                "notes": "ghi chú",
            },
            "serial_number": piano["serial_number"],
            "sale_date": date.today().isoformat(),
            "warranty_months": 12,
            "notes": "test",
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["customer_id"] == customer["id"]
    assert body["warranty_id"] is not None
    assert body["warranty_end_date"] is not None

    customers = client.get("/api/v1/customers", params={"search": "0907111222"}).json()
    assert len(customers) == 1
    assert customers[0]["name"] == "Khách Test"

    piano_response = client.get(f"/api/v1/pianos/{piano['id']}")
    assert piano_response.json()["status"] == "sold"

    warranties = client.get("/api/v1/warranties").json()
    assert len(warranties) == 1
    assert warranties[0]["customer_id"] == customer["id"]


def test_sale_decrements_non_serialized_stock(client):
    customer = create_customer(client, phone="0909000002")
    piano = create_piano(
        client,
        serial=None,
        serial_number=None,
        piano_type="digital",
        quantity=2,
        status="available",
    )

    response = client.post(
        "/api/v1/sales",
        json={
            "customer_id": customer["id"],
            "piano_id": piano["id"],
            "sale_date": date.today().isoformat(),
            "warranty_months": 12,
            "notes": None,
        },
    )
    assert response.status_code == 201, response.text

    piano_response = client.get(f"/api/v1/pianos/{piano['id']}")
    body = piano_response.json()
    assert body["quantity"] == 1
    assert body["status"] == "available"


def test_sale_sale_end_date_uses_calendar_months(client):
    customer = create_customer(client, phone="0909000007")
    piano = create_piano(client, serial="END-DATE-001")

    response = client.post(
        "/api/v1/sales",
        json={
            "customer_id": customer["id"],
            "piano_id": piano["id"],
            "sale_date": "2026-01-31",
            "warranty_months": 1,
            "notes": None,
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["warranty_end_date"] == "2026-02-28"


def test_sale_rejects_missing_or_unavailable_piano(client):
    customer = create_customer(client, phone="0909000004")
    missing = client.post(
        "/api/v1/sales",
        json={
            "customer_id": customer["id"],
            "serial_number": "NO-SUCH-SERIAL",
            "sale_date": date.today().isoformat(),
            "warranty_months": 12,
            "notes": None,
        },
    )
    assert missing.status_code == 404, missing.text

    piano = create_piano(client, status="reserved")
    unavailable = client.post(
        "/api/v1/sales",
        json={
            "customer_id": customer["id"],
            "piano_id": piano["id"],
            "sale_date": date.today().isoformat(),
            "warranty_months": 12,
            "notes": None,
        },
    )
    assert unavailable.status_code == 422, unavailable.text

    assert client.get("/api/v1/warranties").json() == []


def test_sale_rolls_back_when_warranty_insert_fails(client, monkeypatch):
    customer = create_customer(client, phone="0909000005")
    piano = create_piano(client)

    def fail_commit(self):
        raise Exception("commit failed")

    monkeypatch.setattr("app.services.sale_service.Session.commit", fail_commit)

    with pytest.raises(Exception, match="commit failed"):
        client.post(
            "/api/v1/sales",
            json={
                "customer_id": customer["id"],
                "piano_id": piano["id"],
                "sale_date": date.today().isoformat(),
                "warranty_months": 12,
                "notes": None,
            },
        )

    refreshed = client.get(f"/api/v1/pianos/{piano['id']}")
    assert refreshed.json()["status"] == "available"


def test_sale_decrements_non_serialized_stock(client):
    customer = create_customer(client, phone="0909000002")
    piano = create_piano(
        client,
        serial=None,
        serial_number=None,
        piano_type="digital",
        quantity=2,
        status="available",
    )

    response = client.post(
        "/api/v1/sales",
        json={
            "customer_id": customer["id"],
            "piano_id": piano["id"],
            "sale_date": date.today().isoformat(),
            "warranty_months": 12,
            "notes": None,
        },
    )
    assert response.status_code == 201, response.text

    piano_response = client.get(f"/api/v1/pianos/{piano['id']}")
    body = piano_response.json()
    assert body["quantity"] == 1
    assert body["status"] == "available"


def test_sale_sale_end_date_uses_calendar_months(client):
    customer = create_customer(client, phone="0909000007")
    piano = create_piano(client, serial="END-DATE-001")

    response = client.post(
        "/api/v1/sales",
        json={
            "customer_id": customer["id"],
            "piano_id": piano["id"],
            "sale_date": "2026-01-31",
            "warranty_months": 1,
            "notes": None,
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["warranty_end_date"] == "2026-02-28"


def test_dashboard_uses_operational_metrics(client):
    customer = create_customer(client)
    create_piano(client)
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["kpis"]["available_pianos"] == 1
    assert body["kpis"]["total_customers"] == 1
    assert body["recent_customers"][0]["name"] == customer["name"]


def test_dashboard_includes_leads_when_customer_exists(client):
    customer = create_customer(client, phone="0909000999")
    response = client.post(
        "/api/v1/leads",
        json={
            "customer_id": customer["id"],
            "budget_min": 1000000,
            "budget_max": 2000000,
            "interested_brand": "Kawai",
            "interested_model": "K-300",
            "status": "new",
            "follow_up_date": date.today().isoformat(),
            "notes": "Ưu tiên gọi lại",
        },
    )
    assert response.status_code == 201, response.text

    dashboard = client.get("/api/v1/dashboard")
    assert dashboard.status_code == 200, dashboard.text
    body = dashboard.json()
    assert body["kpis"]["action_items"] >= 1


def test_dashboard_returns_503_on_database_disconnect(client, monkeypatch):
    def fail(self, *args, **kwargs):
        raise OperationalError("SELECT 1", {}, Exception("server closed the connection unexpectedly"))

    monkeypatch.setattr(DashboardService, "get", fail)

    response = client.get("/api/v1/dashboard")
    assert response.status_code == 503, response.text
    assert response.json() == {"detail": "Cơ sở dữ liệu tạm thời không khả dụng"}


def test_ai_endpoint_respects_llm_flag(client, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "llm_enabled", False)
    monkeypatch.setattr(settings, "llm_model", "")
    monkeypatch.setattr(settings, "llm_api_key", "")

    response = client.post(
        "/api/v1/ai/chat",
        json={"message": "Khách nào cần chú ý?", "conversation_id": None},
    )
    assert response.status_code == 200, response.text
    assert response.json()["mode"] == "disabled"
    assert response.json()["conversation_id"]
