from __future__ import annotations

from datetime import date

from app.ai.agent import ShopAgent
from app.ai.tools import ShopAITools
from app.core.config import Settings
from app.schemas.customer import CustomerCreate
from app.schemas.piano import PianoCreate
from app.schemas.sale import SaleCreate
from app.services.customer_service import CustomerService
from app.services.piano_service import PianoService
from app.services.sale_service import SaleService


def test_ai_tools_read_real_shop_data(db_session):
    customer = CustomerService(db_session).create(
        CustomerCreate(name="Anh Minh Test", phone="0907111222")
    )
    piano = PianoService(db_session).create(
        PianoCreate(brand="Kawai", model="KL-901", serial_number="AI-KW-001")
    )
    SaleService(db_session).create(
        SaleCreate(
            customer_id=customer.id,
            piano_id=piano.id,
            sale_date=date(2026, 8, 10),
            warranty_months=12,
        )
    )

    tools = ShopAITools(db_session)
    matches = tools.find_customer("Minh")
    assert matches[0]["phone"] == "0907111222"

    history = tools.get_customer_history(str(customer.id))
    assert history["purchases"][0]["piano"] == "Kawai KL-901"
    assert history["purchases"][0]["warranty_active"] is True


def test_ai_agent_handles_invalid_tool_arguments(db_session):
    agent = ShopAgent(db_session, Settings(llm_enabled=True, llm_api_key="test", llm_model="test"))
    result = agent._tool_node(
        {
            "messages": [
                {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "id": "call_1",
                            "function": {"name": "find_customer", "arguments": "{}"},
                        }
                    ],
                }
            ],
            "tool_calls_used": [],
        }
    )

    assert result["messages"][-1]["content"]
    assert "Invalid tool call for find_customer" in result["messages"][-1]["content"]
