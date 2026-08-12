from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.enums import PianoStatus
from app.models.piano import Piano
from app.models.sale import Sale
from app.repositories.customer_repository import CustomerRepository
from app.repositories.lead_repository import LeadRepository
from app.repositories.piano_repository import PianoRepository
from app.repositories.sale_repository import SaleRepository
from app.repositories.service_repository import ServiceRepository
from app.repositories.warranty_repository import WarrantyRepository


TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "find_customer",
            "description": "Tìm khách theo tên hoặc số điện thoại.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_customer_history",
            "description": "Xem đàn đã mua, bảo hành và lịch sử bảo trì của một khách.",
            "parameters": {
                "type": "object",
                "properties": {"customer_id": {"type": "string"}},
                "required": ["customer_id"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_inventory",
            "description": "Tìm các đàn hiện còn tại shop theo hãng hoặc model.",
            "parameters": {
                "type": "object",
                "properties": {
                    "brand": {"type": "string"},
                    "model": {"type": "string"},
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_shop_overview",
            "description": "Lấy số khách, số đàn đang có, số đàn bán trong tháng và số việc cần chú ý.",
            "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_attention_list",
            "description": "Lấy khách cần chăm sóc: follow-up, bảo hành sắp hết, hoặc đến lịch bảo trì.",
            "parameters": {
                "type": "object",
                "properties": {"days": {"type": "integer", "minimum": 1, "maximum": 90}},
                "required": ["days"],
                "additionalProperties": False,
            },
        },
    },
]


class ShopAITools:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.customers = CustomerRepository(db)
        self.pianos = PianoRepository(db)
        self.sales = SaleRepository(db)
        self.warranties = WarrantyRepository(db)
        self.services = ServiceRepository(db)
        self.leads = LeadRepository(db)

    def execute(self, name: str, arguments: dict) -> dict | list:
        handlers = {
            "find_customer": self.find_customer,
            "get_customer_history": self.get_customer_history,
            "search_inventory": self.search_inventory,
            "get_shop_overview": self.get_shop_overview,
            "get_attention_list": self.get_attention_list,
        }
        handler = handlers.get(name)
        if not handler:
            return {"error": f"Unknown tool: {name}"}
        return handler(**arguments)

    def find_customer(self, query: str) -> list[dict]:
        matches = self.customers.search_by_name_or_phone(query)
        return [{"id": str(item.id), "name": item.name, "phone": item.phone} for item in matches]

    def get_customer_history(self, customer_id: str) -> dict:
        try:
            customer_uuid = uuid.UUID(customer_id)
        except ValueError:
            return {"error": "customer_id không hợp lệ"}
        customer = self.customers.get(customer_uuid)
        if not customer:
            return {"error": "Không tìm thấy khách hàng"}
        sales = self.sales.list_by_customer(customer_uuid)
        services = self.services.list_by_customer(customer_uuid)
        return {
            "customer": {"id": str(customer.id), "name": customer.name, "phone": customer.phone},
            "purchases": [
                {
                    "piano": f"{sale.piano.brand} {sale.piano.model}",
                    "serial_number": sale.piano.serial_number,
                    "sale_date": sale.sale_date.isoformat(),
                    "warranty_end_date": sale.warranty.end_date.isoformat() if sale.warranty else None,
                    "warranty_active": bool(sale.warranty and sale.warranty.end_date >= date.today()),
                }
                for sale in sales
            ],
            "services": [
                {
                    "piano": f"{item.piano.brand} {item.piano.model}",
                    "service_date": item.service_date.isoformat(),
                    "service_type": item.service_type,
                    "next_service_date": item.next_service_date.isoformat() if item.next_service_date else None,
                    "status": item.status.value,
                }
                for item in services[:10]
            ],
        }

    def search_inventory(self, brand: str | None = None, model: str | None = None) -> list[dict]:
        items = self.pianos.search_available(brand=brand, model=model)
        return [
            {
                "id": str(item.id),
                "brand": item.brand,
                "model": item.model,
                "serial_number": item.serial_number,
                "year": item.year,
                "condition": item.condition.value,
                "color": item.color,
            }
            for item in items
        ]

    def get_shop_overview(self) -> dict:
        today = date.today()
        month_start = today.replace(day=1)
        available = self.db.scalar(
            select(func.count(Piano.id)).where(Piano.status == PianoStatus.AVAILABLE)
        ) or 0
        customers = self.db.scalar(select(func.count(Customer.id))) or 0
        sold = (
            self.db.scalar(
                select(func.count(Sale.id)).where(Sale.sale_date >= month_start, Sale.sale_date <= today)
            )
            or 0
        )
        attention = (
            len(self.warranties.expiring_within(30))
            + len(self.services.due_within(30))
            + len(self.leads.followups_within(14))
        )
        return {
            "available_pianos": available,
            "customers": customers,
            "sold_this_month": sold,
            "attention_items": attention,
        }

    def get_attention_list(self, days: int) -> dict:
        warranties = self.warranties.expiring_within(days)
        services = self.services.due_within(days)
        followups = self.leads.followups_within(min(days, 30))
        return {
            "warranties": [
                {
                    "customer": item.sale.customer.name,
                    "piano": f"{item.sale.piano.brand} {item.sale.piano.model}",
                    "due_date": item.end_date.isoformat(),
                }
                for item in warranties
            ],
            "maintenance": [
                {
                    "customer": item.customer.name,
                    "piano": f"{item.piano.brand} {item.piano.model}",
                    "due_date": item.next_service_date.isoformat() if item.next_service_date else None,
                }
                for item in services
            ],
            "followups": [
                {
                    "customer": item.customer_name,
                    "interest": " ".join(filter(None, [item.interested_brand, item.interested_model])),
                    "due_date": item.follow_up_date.isoformat() if item.follow_up_date else None,
                }
                for item in followups
            ],
        }
