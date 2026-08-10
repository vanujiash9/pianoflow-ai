from __future__ import annotations

from datetime import date, timedelta

from app.core.database import Base, SessionLocal, engine
from app.models.enums import LeadStatus, PianoCondition, PianoStatus, ServiceStatus
from app.schemas.customer import CustomerCreate
from app.schemas.lead import LeadCreate
from app.schemas.piano import PianoCreate
from app.schemas.sale import SaleCreate
from app.schemas.service_record import ServiceRecordCreate
from app.services.customer_service import CustomerService
from app.services.lead_service import LeadService
from app.services.piano_service import PianoService
from app.services.sale_service import SaleService
from app.services.service_service import MaintenanceService


def main() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        customers = CustomerService(db)
        pianos = PianoService(db)
        sales = SaleService(db)
        maintenance = MaintenanceService(db)
        leads = LeadService(db)

        customer_rows = [
            CustomerCreate(name="Anh Minh", phone="0901000001", address="TP.HCM", notes="Ưa Kawai"),
            CustomerCreate(name="Chị Lan", phone="0901000002", address="Bình Dương"),
            CustomerCreate(name="Anh Hùng", phone="0901000003", address="TP.HCM"),
            CustomerCreate(name="Cô Mai", phone="0901000004", address="Đồng Nai"),
            CustomerCreate(name="Anh Nam", phone="0901000005", address="TP.HCM"),
        ]
        created_customers = [customers.create(row) for row in customer_rows]

        piano_rows = [
            PianoCreate(brand="Kawai", model="KL-901", serial_number="KW-KL901-001", year=1987, color="Đen", condition=PianoCondition.USED),
            PianoCreate(brand="Yamaha", model="U1", serial_number="YM-U1-102", year=1992, color="Đen", condition=PianoCondition.USED),
            PianoCreate(brand="Kawai", model="BL-31", serial_number="KW-BL31-210", year=1985, color="Đen", condition=PianoCondition.USED),
            PianoCreate(brand="Yamaha", model="UX", serial_number="YM-UX-313", year=1990, color="Đen", condition=PianoCondition.USED),
            PianoCreate(brand="Kawai", model="K300", serial_number="KW-K300-501", year=2018, color="Đen", condition=PianoCondition.USED),
            PianoCreate(brand="Yamaha", model="U3", serial_number="YM-U3-888", year=1995, color="Đen", condition=PianoCondition.USED),
            PianoCreate(brand="Kawai", model="NS-15", serial_number="KW-NS15-765", year=1989, color="Nâu", condition=PianoCondition.USED),
            PianoCreate(brand="Yamaha", model="W106", serial_number="YM-W106-600", year=1986, color="Nâu", condition=PianoCondition.USED),
        ]
        created_pianos = [pianos.create(row) for row in piano_rows]

        today = date.today()
        sale_specs = [
            (0, 0, today - timedelta(days=350), 12),
            (1, 1, today - timedelta(days=120), 12),
            (2, 2, today - timedelta(days=20), 24),
            (3, 3, today - timedelta(days=4), 12),
        ]
        for customer_idx, piano_idx, sold_at, warranty_months in sale_specs:
            sales.create(
                SaleCreate(
                    customer_id=created_customers[customer_idx].id,
                    piano_id=created_pianos[piano_idx].id,
                    sale_date=sold_at,
                    warranty_months=warranty_months,
                    notes="Dữ liệu demo",
                )
            )

        maintenance.create(
            ServiceRecordCreate(
                customer_id=created_customers[0].id,
                piano_id=created_pianos[0].id,
                service_date=today - timedelta(days=150),
                service_type="Căn chỉnh và vệ sinh",
                description="Kiểm tra phím và pedal",
                next_service_date=today + timedelta(days=12),
                status=ServiceStatus.COMPLETED,
            )
        )
        maintenance.create(
            ServiceRecordCreate(
                customer_id=created_customers[1].id,
                piano_id=created_pianos[1].id,
                service_date=today + timedelta(days=20),
                service_type="Bảo trì định kỳ",
                next_service_date=None,
                status=ServiceStatus.SCHEDULED,
            )
        )

        leads.create(
            LeadCreate(
                customer_name="Chị Hương",
                phone="0912000001",
                budget_min=20_000_000,
                budget_max=30_000_000,
                interested_brand="Kawai",
                status=LeadStatus.CONSIDERING,
                follow_up_date=today + timedelta(days=2),
                notes="Mua cho bé mới học",
            )
        )
        leads.create(
            LeadCreate(
                customer_name="Anh Tuấn",
                phone="0912000002",
                interested_brand="Yamaha",
                interested_model="U3",
                status=LeadStatus.VISITED,
                follow_up_date=today + timedelta(days=5),
            )
        )

    print("Seed completed.")


if __name__ == "__main__":
    main()
