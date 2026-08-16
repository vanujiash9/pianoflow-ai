from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import delete

from app.core.database import Base, SessionLocal, engine
from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage
from app.models.customer import Customer
from app.models.enums import LeadStatus, MessageRole, PianoCondition, PianoStatus, PianoType, ServiceStatus
from app.models.lead import Lead
from app.models.piano import Piano
from app.models.sale import Sale
from app.models.service_record import ServiceRecord
from app.models.warranty import Warranty
from app.schemas.customer import CustomerCreate, CustomerInput
from app.schemas.lead import LeadCreate
from app.schemas.piano import PianoCreate
from app.schemas.sale import SaleCreate
from app.schemas.service_record import ServiceRecordCreate
from app.services.customer_service import CustomerService
from app.services.lead_service import LeadService
from app.services.piano_service import PianoService
from app.services.sale_service import SaleService
from app.services.service_service import MaintenanceService


@dataclass(frozen=True)
class SeedSummary:
    customers: int
    leads: int
    pianos: int
    sales: int
    warranties: int
    services: int
    conversations: int
    messages: int


CUSTOMERS = [
    {"name": "Nguyễn Minh Anh", "phone": "0901000001", "address": "Quận 1, TP.HCM", "notes": "Khách quen, thích Yamaha"},
    {"name": "Trần Quốc Huy", "phone": "0901000002", "address": "Thủ Đức, TP.HCM", "notes": "Đã mua 1 đàn upright"},
    {"name": "Lê Thị Thanh", "phone": "0901000003", "address": "Biên Hòa, Đồng Nai", "notes": "Ưu tiên piano cho bé học"},
    {"name": "Phạm Hoàng Nam", "phone": "0901000004", "address": "Nha Trang, Khánh Hòa", "notes": None},
    {"name": "Bùi Gia Hân", "phone": "0901000005", "address": "Quận 7, TP.HCM", "notes": "Thường hỏi về bảo trì"},
    {"name": "Đặng Văn Duy", "phone": "0901000006", "address": "Tân Bình, TP.HCM", "notes": "Cần model nhỏ cho căn hộ"},
    {"name": "Võ Nhật Linh", "phone": "0901000007", "address": "Hà Nội", "notes": "Quan tâm grand piano"},
    {"name": "Huỳnh Thảo My", "phone": "0901000008", "address": "Bình Dương", "notes": "Đã từng là lead"},
    {"name": "Đỗ Gia Khánh", "phone": "0901000009", "address": "Cần Thơ", "notes": None},
    {"name": "Ngô Bảo Trâm", "phone": "0901000010", "address": "Hải Phòng", "notes": "Người mới học"},
    {"name": "Phan Quốc Việt", "phone": "0901000011", "address": "Quận 3, TP.HCM", "notes": "Cần xuất hóa đơn"},
    {"name": "Lý Thu Hà", "phone": "0901000012", "address": "Đà Nẵng", "notes": "Yêu cầu giao hàng xa"},
    {"name": "Trịnh Gia Bảo", "phone": "0901000013", "address": "Quận 12, TP.HCM", "notes": None},
    {"name": "Nguyễn Hồng Nhung", "phone": "0901000014", "address": "Long An", "notes": "Từng mua khóa học piano"},
    {"name": "Mai Đức Long", "phone": "0901000015", "address": "Bình Thạnh, TP.HCM", "notes": "So sánh Kawai và Yamaha"},
    {"name": "Trần Thị Kim Oanh", "phone": "0901000016", "address": "Vũng Tàu", "notes": "Ưa màu đen bóng"},
    {"name": "Lê Quang Phúc", "phone": "0901000017", "address": "TP.HCM", "notes": None},
    {"name": "Phạm Nhật Hạ", "phone": "0901000018", "address": "Bến Tre", "notes": "Cần tư vấn phòng nhỏ"},
    {"name": "Nguyễn Thùy Dung", "phone": "0901000019", "address": "TP.HCM", "notes": "Khách bảo trì định kỳ"},
    {"name": "Trần Gia Phát", "phone": "0901000020", "address": "Đồng Nai", "notes": None},
    {"name": "Lê Nhật Nam", "phone": "0901000021", "address": "TP.HCM", "notes": "Cần đàn cho nhạc viện"},
    {"name": "Phan Minh Khang", "phone": "0901000022", "address": "Bình Phước", "notes": None},
    {"name": "Đinh Khánh Vy", "phone": "0901000023", "address": "Đà Lạt", "notes": "Thích model mới"},
    {"name": "Nguyễn Đức Anh", "phone": "0901000024", "address": "Quảng Nam", "notes": None},
    {"name": "Tạ Hoàng Yến", "phone": "0901000025", "address": "TP.HCM", "notes": "Có nhu cầu đổi đàn"},
    {"name": "Lương Minh Tâm", "phone": "0901000026", "address": "TP.HCM", "notes": None},
    {"name": "Phùng Khánh Linh", "phone": "0901000027", "address": "Ninh Bình", "notes": "Cần tủ chống ẩm"},
    {"name": "Nguyễn Hải Đăng", "phone": "0901000028", "address": "TP.HCM", "notes": None},
    {"name": "Hoàng Gia Huy", "phone": "0901000029", "address": "Hà Nội", "notes": "Quan tâm serial cụ thể"},
    {"name": "Bùi Minh Tường", "phone": "0901000030", "address": "TP.HCM", "notes": "Khách trung thành"},
    {"name": "Đoàn Thị Ngọc", "phone": "0901000031", "address": "Tiền Giang", "notes": None},
    {"name": "Vũ Thành Đạt", "phone": "0901000032", "address": "TP.HCM", "notes": "Nhà có phòng khách rộng"},
    {"name": "Lê Bảo Ngọc", "phone": "0901000033", "address": "Cà Mau", "notes": None},
    {"name": "Trần Minh Châu", "phone": "0901000034", "address": "TP.HCM", "notes": "Ưu tiên trả góp"},
    {"name": "Nguyễn Phúc Thịnh", "phone": "0901000035", "address": "Hậu Giang", "notes": None},
    {"name": "Cao Gia Hân", "phone": "0901000036", "address": "TP.HCM", "notes": "Thích âm trầm sâu"},
]

PIANOS = [
    {"brand": "Yamaha", "model": "U1", "year": 1992, "serial_number": "YM-U1-1992-001", "piano_type": PianoType.UPRIGHT, "size_cm": 121, "pedal_count": 3, "purchase_price": Decimal("65000000"), "retail_price": Decimal("89000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": "U1J", "arrival_date": date.today() - timedelta(days=520), "color": "Đen bóng", "condition": PianoCondition.USED, "notes": "Model phổ biến cho học sinh và gia đình"},
    {"brand": "Yamaha", "model": "U1", "year": 1993, "serial_number": "YM-U1-1993-001A", "piano_type": PianoType.UPRIGHT, "size_cm": 121, "pedal_count": 3, "purchase_price": Decimal("66000000"), "retail_price": Decimal("90000000"), "status": PianoStatus.SOLD, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=500), "color": "Đen", "condition": PianoCondition.USED, "notes": "Bản demo đã bán"},
    {"brand": "Yamaha", "model": "U3", "year": 1995, "serial_number": "YM-U3-1995-002", "piano_type": PianoType.UPRIGHT, "size_cm": 131, "pedal_count": 3, "purchase_price": Decimal("82000000"), "retail_price": Decimal("118000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": "U3H", "arrival_date": date.today() - timedelta(days=430), "color": "Đen bóng", "condition": PianoCondition.USED, "notes": None},
    {"brand": "Yamaha", "model": "YUS5", "year": 2003, "serial_number": "YM-YUS5-2003-003", "piano_type": PianoType.UPRIGHT, "size_cm": 131, "pedal_count": 3, "purchase_price": Decimal("138000000"), "retail_price": Decimal("186000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": "YUS5 Silent", "arrival_date": date.today() - timedelta(days=18), "color": "Đen", "condition": PianoCondition.NEW, "notes": "Hàng trưng bày còn rất đẹp"},
    {"brand": "Kawai", "model": "K-300", "year": 2019, "serial_number": "KW-K300-2019-004", "piano_type": PianoType.UPRIGHT, "size_cm": 122, "pedal_count": 3, "purchase_price": Decimal("118000000"), "retail_price": Decimal("158000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": "K-300 ATX", "arrival_date": date.today() - timedelta(days=12), "color": "Đen", "condition": PianoCondition.NEW, "notes": "Phù hợp phòng tập nhỏ"},
    {"brand": "Kawai", "model": "K-500", "year": 2020, "serial_number": "KW-K500-2020-005", "piano_type": PianoType.UPRIGHT, "size_cm": 130, "pedal_count": 3, "purchase_price": Decimal("168000000"), "retail_price": Decimal("219000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=9), "color": "Đen satin", "condition": PianoCondition.NEW, "notes": "Âm lượng lớn, thích hợp phòng biểu diễn"},
    {"brand": "Kawai", "model": "BL-61", "year": 1987, "serial_number": "KW-BL61-1987-006", "piano_type": PianoType.UPRIGHT, "size_cm": 131, "pedal_count": 3, "purchase_price": Decimal("54000000"), "retail_price": Decimal("79000000"), "status": PianoStatus.SOLD, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=640), "color": "Nâu gỗ", "condition": PianoCondition.USED, "notes": "Được bảo dưỡng tốt"},
    {"brand": "Steinway & Sons", "model": "Model B", "year": 2008, "serial_number": "SS-MB-2008-007", "piano_type": PianoType.GRAND, "size_cm": 211, "pedal_count": 3, "purchase_price": Decimal("680000000"), "retail_price": Decimal("920000000"), "status": PianoStatus.RESERVED, "quantity": 1, "variant": "Concert", "arrival_date": date.today() - timedelta(days=32), "color": "Đen bóng", "condition": PianoCondition.USED, "notes": "Dùng cho khách biểu diễn chuyên nghiệp"},
    {"brand": "Boston", "model": "UP-118E", "year": 2016, "serial_number": "BS-UP118E-2016-008", "piano_type": PianoType.UPRIGHT, "size_cm": 118, "pedal_count": 3, "purchase_price": Decimal("68000000"), "retail_price": Decimal("98000000"), "status": PianoStatus.AVAILABLE, "quantity": 2, "variant": None, "arrival_date": date.today() + timedelta(days=8), "color": "Đen", "condition": PianoCondition.NEW, "notes": "Có 2 cây cùng lô hàng"},
    {"brand": "Roland", "model": "LX708", "year": 2022, "serial_number": "RL-LX708-2022-009", "piano_type": PianoType.DIGITAL, "size_cm": None, "pedal_count": 3, "purchase_price": Decimal("72000000"), "retail_price": Decimal("97000000"), "status": PianoStatus.AVAILABLE, "quantity": 4, "variant": "Digital", "arrival_date": date.today() - timedelta(days=21), "color": "Trắng", "condition": PianoCondition.NEW, "notes": "Mẫu digital cao cấp"},
    {"brand": "Casio", "model": "GP-510", "year": 2021, "serial_number": "CS-GP510-2021-010", "piano_type": PianoType.DIGITAL, "size_cm": None, "pedal_count": 3, "purchase_price": Decimal("56000000"), "retail_price": Decimal("76000000"), "status": PianoStatus.AVAILABLE, "quantity": 3, "variant": None, "arrival_date": date.today() - timedelta(days=16), "color": "Đen", "condition": PianoCondition.NEW, "notes": None},
    {"brand": "Yamaha", "model": "W106", "year": 1986, "serial_number": "YM-W106-1986-011", "piano_type": PianoType.UPRIGHT, "size_cm": 132, "pedal_count": 3, "purchase_price": Decimal("49000000"), "retail_price": Decimal("69000000"), "status": PianoStatus.SOLD, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=760), "color": "Nâu", "condition": PianoCondition.USED, "notes": "Tone ấm, phù hợp phòng khách"},
    {"brand": "Kawai", "model": "NS-15", "year": 1989, "serial_number": "KW-NS15-1989-012", "piano_type": PianoType.UPRIGHT, "size_cm": 125, "pedal_count": 3, "purchase_price": Decimal("45000000"), "retail_price": Decimal("62000000"), "status": PianoStatus.OUT_OF_STOCK, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=410), "color": "Nâu", "condition": PianoCondition.USED, "notes": "Lô hàng đã bán hết"},
    {"brand": "Yamaha", "model": "UX", "year": 1990, "serial_number": "YM-UX-1990-013", "piano_type": PianoType.UPRIGHT, "size_cm": 131, "pedal_count": 3, "purchase_price": Decimal("93000000"), "retail_price": Decimal("124000000"), "status": PianoStatus.SERVICE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=60), "color": "Đen", "condition": PianoCondition.USED, "notes": "Đang chỉnh action"},
    {"brand": "Kawai", "model": "BL-31", "year": 1985, "serial_number": "KW-BL31-1985-014", "piano_type": PianoType.UPRIGHT, "size_cm": 124, "pedal_count": 3, "purchase_price": Decimal("42000000"), "retail_price": Decimal("59000000"), "status": PianoStatus.PAUSED, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=280), "color": "Đen", "condition": PianoCondition.USED, "notes": "Chờ kiểm tra lại dây"},
    {"brand": "Yamaha", "model": "GB1K", "year": 2015, "serial_number": "YM-GB1K-2015-015", "piano_type": PianoType.GRAND, "size_cm": 151, "pedal_count": 3, "purchase_price": Decimal("255000000"), "retail_price": Decimal("328000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=30), "color": "Đen bóng", "condition": PianoCondition.NEW, "notes": "Grand nhỏ gọn cho biệt thự"},
    {"brand": "Kawai", "model": "K-15E", "year": 2023, "serial_number": "KW-K15E-2023-016", "piano_type": PianoType.UPRIGHT, "size_cm": 110, "pedal_count": 3, "purchase_price": Decimal("62000000"), "retail_price": Decimal("86000000"), "status": PianoStatus.AVAILABLE, "quantity": 5, "variant": None, "arrival_date": date.today() - timedelta(days=5), "color": "Trắng", "condition": PianoCondition.NEW, "notes": "Mẫu nhập mới, nhiều màu"},
    {"brand": "Yamaha", "model": "B3", "year": 2022, "serial_number": "YM-B3-2022-017", "piano_type": PianoType.UPRIGHT, "size_cm": 121, "pedal_count": 3, "purchase_price": Decimal("75000000"), "retail_price": Decimal("101000000"), "status": PianoStatus.AVAILABLE, "quantity": 2, "variant": None, "arrival_date": date.today() - timedelta(days=3), "color": "Đen", "condition": PianoCondition.NEW, "notes": None},
    {"brand": "Kawai", "model": "K-600", "year": 2024, "serial_number": "KW-K600-2024-018", "piano_type": PianoType.UPRIGHT, "size_cm": 134, "pedal_count": 3, "purchase_price": Decimal("210000000"), "retail_price": Decimal("279000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": "Flagship", "arrival_date": date.today() - timedelta(days=1), "color": "Đen", "condition": PianoCondition.NEW, "notes": "Model cao cấp nhất dòng upright"},
    {"brand": "Yamaha", "model": "U1 Silent", "year": 2000, "serial_number": "YM-U1S-2000-019", "piano_type": PianoType.UPRIGHT, "size_cm": 121, "pedal_count": 3, "purchase_price": Decimal("91000000"), "retail_price": Decimal("129000000"), "status": PianoStatus.SOLD, "quantity": 1, "variant": "Silent", "arrival_date": date.today() - timedelta(days=540), "color": "Đen", "condition": PianoCondition.USED, "notes": "Đã bán cho gia đình có trẻ nhỏ"},
    {"brand": "Kawai", "model": "GL-10", "year": 2021, "serial_number": "KW-GL10-2021-020", "piano_type": PianoType.GRAND, "size_cm": 153, "pedal_count": 3, "purchase_price": Decimal("198000000"), "retail_price": Decimal("254000000"), "status": PianoStatus.RESERVED, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=17), "color": "Đen", "condition": PianoCondition.NEW, "notes": "Grand nhỏ cho showroom"},
    {"brand": "Boston", "model": "GP-178PE", "year": 2017, "serial_number": "BS-GP178PE-2017-021", "piano_type": PianoType.GRAND, "size_cm": 178, "pedal_count": 3, "purchase_price": Decimal("340000000"), "retail_price": Decimal("455000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=42), "color": "Đen", "condition": PianoCondition.USED, "notes": None},
    {"brand": "Roland", "model": "F701", "year": 2023, "serial_number": "RL-F701-2023-022", "piano_type": PianoType.DIGITAL, "size_cm": None, "pedal_count": 3, "purchase_price": Decimal("25000000"), "retail_price": Decimal("32000000"), "status": PianoStatus.OUT_OF_STOCK, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=8), "color": "Trắng", "condition": PianoCondition.NEW, "notes": "Đã hết hàng trưng bày"},
    {"brand": "Casio", "model": "AP-470", "year": 2022, "serial_number": "CS-AP470-2022-023", "piano_type": PianoType.DIGITAL, "size_cm": None, "pedal_count": 3, "purchase_price": Decimal("18000000"), "retail_price": Decimal("24500000"), "status": PianoStatus.AVAILABLE, "quantity": 6, "variant": None, "arrival_date": date.today() - timedelta(days=4), "color": "Nâu", "condition": PianoCondition.NEW, "notes": "Phù hợp người mới học"},
    {"brand": "Yamaha", "model": "U100", "year": 1998, "serial_number": "YM-U100-1998-024", "piano_type": PianoType.UPRIGHT, "size_cm": 121, "pedal_count": 3, "purchase_price": Decimal("70000000"), "retail_price": Decimal("94000000"), "status": PianoStatus.AVAILABLE, "quantity": 2, "variant": None, "arrival_date": date.today() - timedelta(days=88), "color": "Đen", "condition": PianoCondition.USED, "notes": "Hợp lớp học piano"},
    {"brand": "Kawai", "model": "K-200", "year": 2018, "serial_number": "KW-K200-2018-025", "piano_type": PianoType.UPRIGHT, "size_cm": 114, "pedal_count": 3, "purchase_price": Decimal("88000000"), "retail_price": Decimal("119000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=19), "color": "Đen", "condition": PianoCondition.NEW, "notes": "Cây đàn gọn cho căn hộ"},
    {"brand": "Yamaha", "model": "C3X", "year": 2024, "serial_number": "YM-C3X-2024-026", "piano_type": PianoType.GRAND, "size_cm": 186, "pedal_count": 3, "purchase_price": Decimal("355000000"), "retail_price": Decimal("468000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=2), "color": "Đen bóng", "condition": PianoCondition.NEW, "notes": "Trưng bày mới về"},
    {"brand": "Kawai", "model": "ND-21", "year": 1991, "serial_number": "KW-ND21-1991-027", "piano_type": PianoType.UPRIGHT, "size_cm": 120, "pedal_count": 3, "purchase_price": Decimal("36000000"), "retail_price": Decimal("52000000"), "status": PianoStatus.SERVICE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=150), "color": "Nâu", "condition": PianoCondition.USED, "notes": "Đang thay chốt pin"},
    {"brand": "Yamaha", "model": "M2", "year": 2020, "serial_number": "YM-M2-2020-028", "piano_type": PianoType.UPRIGHT, "size_cm": 112, "pedal_count": 3, "purchase_price": Decimal("58000000"), "retail_price": Decimal("76000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=7), "color": "Trắng", "condition": PianoCondition.NEW, "notes": None},
    {"brand": "Kawai", "model": "K-800", "year": 2024, "serial_number": "KW-K800-2024-029", "piano_type": PianoType.UPRIGHT, "size_cm": 134, "pedal_count": 3, "purchase_price": Decimal("245000000"), "retail_price": Decimal("318000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=6), "color": "Đen", "condition": PianoCondition.NEW, "notes": "Mẫu trưng bày cao cấp"},
    {"brand": "Yamaha", "model": "U30A", "year": 1989, "serial_number": "YM-U30A-1989-030", "piano_type": PianoType.UPRIGHT, "size_cm": 131, "pedal_count": 3, "purchase_price": Decimal("53000000"), "retail_price": Decimal("73000000"), "status": PianoStatus.SOLD, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=510), "color": "Đen", "condition": PianoCondition.USED, "notes": "Đã bán cho giáo viên nhạc"},
    {"brand": "Kawai", "model": "KX-5", "year": 2019, "serial_number": "KW-KX5-2019-031", "piano_type": PianoType.UPRIGHT, "size_cm": 125, "pedal_count": 3, "purchase_price": Decimal("99000000"), "retail_price": Decimal("136000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=11), "color": "Đen", "condition": PianoCondition.NEW, "notes": None},
    {"brand": "Yamaha", "model": "GB1", "year": 2014, "serial_number": "YM-GB1-2014-032", "piano_type": PianoType.GRAND, "size_cm": 151, "pedal_count": 3, "purchase_price": Decimal("242000000"), "retail_price": Decimal("319000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=24), "color": "Đen", "condition": PianoCondition.USED, "notes": None},
    {"brand": "Roland", "model": "HP704", "year": 2023, "serial_number": "RL-HP704-2023-033", "piano_type": PianoType.DIGITAL, "size_cm": None, "pedal_count": 3, "purchase_price": Decimal("32000000"), "retail_price": Decimal("41000000"), "status": PianoStatus.AVAILABLE, "quantity": 7, "variant": None, "arrival_date": date.today() - timedelta(days=13), "color": "Nâu", "condition": PianoCondition.NEW, "notes": "Nhiều cây cùng mẫu"},
    {"brand": "Casio", "model": "PX-S7000", "year": 2024, "serial_number": "CS-PXS7000-2024-034", "piano_type": PianoType.DIGITAL, "size_cm": None, "pedal_count": 3, "purchase_price": Decimal("29000000"), "retail_price": Decimal("38800000"), "status": PianoStatus.AVAILABLE, "quantity": 4, "variant": None, "arrival_date": date.today() - timedelta(days=15), "color": "Trắng", "condition": PianoCondition.NEW, "notes": "Mỏng nhẹ, dễ vận chuyển"},
    {"brand": "Yamaha", "model": "U2", "year": 1993, "serial_number": "YM-U2-1993-035", "piano_type": PianoType.UPRIGHT, "size_cm": 127, "pedal_count": 3, "purchase_price": Decimal("77000000"), "retail_price": Decimal("103000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=77), "color": "Đen", "condition": PianoCondition.USED, "notes": "Nhiều khách hỏi"},
    {"brand": "Kawai", "model": "GL-30", "year": 2020, "serial_number": "KW-GL30-2020-036", "piano_type": PianoType.GRAND, "size_cm": 166, "pedal_count": 3, "purchase_price": Decimal("240000000"), "retail_price": Decimal("319000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=27), "color": "Đen", "condition": PianoCondition.NEW, "notes": None},
    {"brand": "Yamaha", "model": "C1X", "year": 2021, "serial_number": "YM-C1X-2021-037", "piano_type": PianoType.GRAND, "size_cm": 161, "pedal_count": 3, "purchase_price": Decimal("275000000"), "retail_price": Decimal("359000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=14), "color": "Đen bóng", "condition": PianoCondition.NEW, "notes": None},
    {"brand": "Boston", "model": "GP-193PE", "year": 2018, "serial_number": "BS-GP193PE-2018-038", "piano_type": PianoType.GRAND, "size_cm": 193, "pedal_count": 3, "purchase_price": Decimal("390000000"), "retail_price": Decimal("512000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": None, "arrival_date": date.today() - timedelta(days=41), "color": "Đen", "condition": PianoCondition.USED, "notes": "Đàn biểu diễn lớn"},
    {"brand": "Yamaha", "model": "JU109", "year": 2012, "serial_number": "YM-JU109-2012-039", "piano_type": PianoType.UPRIGHT, "size_cm": 109, "pedal_count": 3, "purchase_price": Decimal("42000000"), "retail_price": Decimal("59000000"), "status": PianoStatus.AVAILABLE, "quantity": 2, "variant": None, "arrival_date": date.today() - timedelta(days=120), "color": "Trắng", "condition": PianoCondition.USED, "notes": "Dành cho lớp học"},
    {"brand": "Kawai", "model": "K-800 ATX", "year": 2024, "serial_number": "KW-K800ATX-2024-040", "piano_type": PianoType.UPRIGHT, "size_cm": 134, "pedal_count": 3, "purchase_price": Decimal("262000000"), "retail_price": Decimal("339000000"), "status": PianoStatus.AVAILABLE, "quantity": 1, "variant": "Silent", "arrival_date": date.today() - timedelta(days=2), "color": "Đen", "condition": PianoCondition.NEW, "notes": "Có hệ silent"},
]

LEADS = [
    {"name": "Nguyễn Minh Anh", "phone": "0901000001", "budget_min": 65000000, "budget_max": 95000000, "interested_brand": "Yamaha", "interested_model": "U1", "status": LeadStatus.CONVERTED, "follow_up_date": date.today() - timedelta(days=2), "notes": "Đã mua qua showroom"},
    {"name": "Trần Quốc Huy", "phone": "0901000002", "budget_min": 100000000, "budget_max": 150000000, "interested_brand": "Kawai", "interested_model": "K-300", "status": LeadStatus.CONVERTED, "follow_up_date": date.today() - timedelta(days=5), "notes": "Đã chốt K-300"},
    {"name": "Lê Thị Thanh", "phone": "0901000003", "budget_min": 30000000, "budget_max": 60000000, "interested_brand": "Casio", "interested_model": "AP-470", "status": LeadStatus.CONTACTED, "follow_up_date": date.today() + timedelta(days=1), "notes": "Đang đợi báo giá"},
    {"name": "Phạm Hoàng Nam", "phone": "0901000004", "budget_min": 70000000, "budget_max": 120000000, "interested_brand": "Yamaha", "interested_model": "U3", "status": LeadStatus.VISITED, "follow_up_date": date.today() + timedelta(days=2), "notes": "Đã đến showroom 2 lần"},
    {"name": "Bùi Gia Hân", "phone": "0901000005", "budget_min": 45000000, "budget_max": 75000000, "interested_brand": "Kawai", "interested_model": "NS-15", "status": LeadStatus.CONSIDERING, "follow_up_date": date.today() + timedelta(days=4), "notes": "Cần đàn cho bé học, note dài: gia đình có 2 bé, muốn đàn dùng lâu, ưu tiên âm mềm và kích thước vừa phải"},
    {"name": "Đặng Văn Duy", "phone": "0901000006", "budget_min": None, "budget_max": None, "interested_brand": None, "interested_model": None, "status": LeadStatus.NEW, "follow_up_date": date.today(), "notes": "Chưa xác định model"},
    {"name": "Võ Nhật Linh", "phone": "0901000007", "budget_min": 680000000, "budget_max": 900000000, "interested_brand": "Steinway & Sons", "interested_model": "Model B", "status": LeadStatus.CONTACTED, "follow_up_date": date.today() + timedelta(days=7), "notes": "Khách cao cấp"},
    {"name": "Huỳnh Thảo My", "phone": "0901000008", "budget_min": 90000000, "budget_max": 130000000, "interested_brand": "Yamaha", "interested_model": "U1 Silent", "status": LeadStatus.LOST, "follow_up_date": date.today() - timedelta(days=10), "notes": "Đã chuyển sang mua đàn khác"},
    {"name": "Đỗ Gia Khánh", "phone": "0901000009", "budget_min": 55000000, "budget_max": 85000000, "interested_brand": "Kawai", "interested_model": "K-200", "status": LeadStatus.NEW, "follow_up_date": date.today() + timedelta(days=3), "notes": None},
    {"name": "Ngô Bảo Trâm", "phone": "0901000010", "budget_min": 18000000, "budget_max": 30000000, "interested_brand": "Roland", "interested_model": "F701", "status": LeadStatus.CONTACTED, "follow_up_date": date.today() + timedelta(days=1), "notes": "Mới học, thích digital"},
    {"name": "Phan Quốc Việt", "phone": "0901000011", "budget_min": 70000000, "budget_max": 110000000, "interested_brand": "Yamaha", "interested_model": "U2", "status": LeadStatus.VISITED, "follow_up_date": date.today() + timedelta(days=6), "notes": "Muốn model có serial cụ thể"},
    {"name": "Lý Thu Hà", "phone": "0901000012", "budget_min": 40000000, "budget_max": 70000000, "interested_brand": "Kawai", "interested_model": "K-15E", "status": LeadStatus.CONSIDERING, "follow_up_date": date.today() + timedelta(days=8), "notes": "Ưa màu trắng"},
    {"name": "Trịnh Gia Bảo", "phone": "0901000013", "budget_min": 25000000, "budget_max": 45000000, "interested_brand": "Casio", "interested_model": "AP-470", "status": LeadStatus.NEW, "follow_up_date": None, "notes": "Gọi lại khi có khuyến mãi"},
    {"name": "Nguyễn Hồng Nhung", "phone": "0901000014", "budget_min": 50000000, "budget_max": 90000000, "interested_brand": "Yamaha", "interested_model": "U100", "status": LeadStatus.CONTACTED, "follow_up_date": date.today() + timedelta(days=5), "notes": None},
    {"name": "Mai Đức Long", "phone": "0901000015", "budget_min": 100000000, "budget_max": 160000000, "interested_brand": "Kawai", "interested_model": "K-500", "status": LeadStatus.VISITED, "follow_up_date": date.today() + timedelta(days=2), "notes": "So sánh âm sắc với Yamaha"},
    {"name": "Trần Thị Kim Oanh", "phone": "0901000016", "budget_min": 60000000, "budget_max": 85000000, "interested_brand": "Yamaha", "interested_model": "U1", "status": LeadStatus.CONVERTED, "follow_up_date": date.today() - timedelta(days=8), "notes": "Đã mua U1 qua khách cũ"},
    {"name": "Lê Quang Phúc", "phone": "0901000017", "budget_min": 300000000, "budget_max": 500000000, "interested_brand": "Yamaha", "interested_model": "C3X", "status": LeadStatus.CONTACTED, "follow_up_date": date.today() + timedelta(days=9), "notes": None},
    {"name": "Phạm Nhật Hạ", "phone": "0901000018", "budget_min": 45000000, "budget_max": 70000000, "interested_brand": "Kawai", "interested_model": "K-200", "status": LeadStatus.CONSIDERING, "follow_up_date": date.today() + timedelta(days=3), "notes": "Phòng nhỏ, cần tư vấn kỹ"},
    {"name": "Nguyễn Thùy Dung", "phone": "0901000019", "budget_min": 35000000, "budget_max": 55000000, "interested_brand": "Roland", "interested_model": "HP704", "status": LeadStatus.LOST, "follow_up_date": date.today() - timedelta(days=6), "notes": "Đã mua digital ở nơi khác"},
    {"name": "Trần Gia Phát", "phone": "0901000020", "budget_min": 120000000, "budget_max": 180000000, "interested_brand": "Yamaha", "interested_model": "YUS5", "status": LeadStatus.NEW, "follow_up_date": date.today() + timedelta(days=1), "notes": None},
    {"name": "Lê Nhật Nam", "phone": "0901000021", "budget_min": 200000000, "budget_max": 350000000, "interested_brand": "Boston", "interested_model": "GP-178PE", "status": LeadStatus.VISITED, "follow_up_date": date.today() + timedelta(days=4), "notes": "Cần đàn cho trường nhạc"},
    {"name": "Phan Minh Khang", "phone": "0901000022", "budget_min": 45000000, "budget_max": 65000000, "interested_brand": "Yamaha", "interested_model": "JU109", "status": LeadStatus.CONTACTED, "follow_up_date": date.today() + timedelta(days=5), "notes": None},
    {"name": "Đinh Khánh Vy", "phone": "0901000023", "budget_min": 250000000, "budget_max": 380000000, "interested_brand": "Kawai", "interested_model": "K-600", "status": LeadStatus.CONSIDERING, "follow_up_date": date.today() + timedelta(days=10), "notes": "Khách premium, yêu cầu trải nghiệm trực tiếp"},
    {"name": "Nguyễn Đức Anh", "phone": "0901000024", "budget_min": 18000000, "budget_max": 28000000, "interested_brand": "Casio", "interested_model": "PX-S7000", "status": LeadStatus.NEW, "follow_up_date": None, "notes": "Quan tâm digital mỏng nhẹ"},
    {"name": "Tạ Hoàng Yến", "phone": "0901000025", "budget_min": 50000000, "budget_max": 85000000, "interested_brand": "Yamaha", "interested_model": "U1", "status": LeadStatus.CONVERTED, "follow_up_date": date.today() - timedelta(days=15), "notes": "Lead cũ đổi sang customer"},
    {"name": "Lương Minh Tâm", "phone": "0901000026", "budget_min": 40000000, "budget_max": 70000000, "interested_brand": "Kawai", "interested_model": "BL-31", "status": LeadStatus.VISITED, "follow_up_date": date.today() + timedelta(days=2), "notes": None},
    {"name": "Phùng Khánh Linh", "phone": "0901000027", "budget_min": 50000000, "budget_max": 90000000, "interested_brand": "Yamaha", "interested_model": "U3", "status": LeadStatus.CONTACTED, "follow_up_date": date.today() + timedelta(days=4), "notes": "Cần tủ chống ẩm kèm theo"},
    {"name": "Nguyễn Hải Đăng", "phone": "0901000028", "budget_min": 70000000, "budget_max": 120000000, "interested_brand": "Yamaha", "interested_model": "U2", "status": LeadStatus.NEW, "follow_up_date": date.today() + timedelta(days=3), "notes": None},
    {"name": "Hoàng Gia Huy", "phone": "0901000029", "budget_min": 60000000, "budget_max": 95000000, "interested_brand": "Yamaha", "interested_model": "U1", "status": LeadStatus.CONTACTED, "follow_up_date": date.today() + timedelta(days=6), "notes": "Tìm serial cụ thể theo năm sản xuất"},
    {"name": "Bùi Minh Tường", "phone": "0901000030", "budget_min": 100000000, "budget_max": 180000000, "interested_brand": "Kawai", "interested_model": "K-500", "status": LeadStatus.CONSIDERING, "follow_up_date": date.today() + timedelta(days=7), "notes": "Khách trung thành, từng mua phụ kiện"},
    {"name": "Đoàn Thị Ngọc", "phone": "0901000031", "budget_min": 30000000, "budget_max": 50000000, "interested_brand": "Roland", "interested_model": "F701", "status": LeadStatus.LOST, "follow_up_date": date.today() - timedelta(days=20), "notes": None},
    {"name": "Vũ Thành Đạt", "phone": "0901000032", "budget_min": 250000000, "budget_max": 400000000, "interested_brand": "Yamaha", "interested_model": "C3X", "status": LeadStatus.VISITED, "follow_up_date": date.today() + timedelta(days=9), "notes": "Phòng khách rộng, cần grand"},
    {"name": "Lê Bảo Ngọc", "phone": "0901000033", "budget_min": 35000000, "budget_max": 60000000, "interested_brand": "Casio", "interested_model": "AP-470", "status": LeadStatus.NEW, "follow_up_date": None, "notes": None},
    {"name": "Trần Minh Châu", "phone": "0901000034", "budget_min": 70000000, "budget_max": 120000000, "interested_brand": "Yamaha", "interested_model": "U100", "status": LeadStatus.CONTACTED, "follow_up_date": date.today() + timedelta(days=1), "notes": "Cần hỗ trợ trả góp"},
    {"name": "Nguyễn Phúc Thịnh", "phone": "0901000035", "budget_min": 200000000, "budget_max": 300000000, "interested_brand": "Kawai", "interested_model": "K-800", "status": LeadStatus.CONSIDERING, "follow_up_date": date.today() + timedelta(days=8), "notes": None},
    {"name": "Cao Gia Hân", "phone": "0901000036", "budget_min": 50000000, "budget_max": 90000000, "interested_brand": "Yamaha", "interested_model": "U1", "status": LeadStatus.NEW, "follow_up_date": date.today() + timedelta(days=2), "notes": "Thích âm trầm sâu"},
]

SALES = [
    {"customer_phone": "0901000001", "piano_serial": "YM-U1-1992-001", "sale_date": date.today() - timedelta(days=360), "warranty_months": 24, "notes": "Khách cũ nâng cấp từ digital"},
    {"customer_phone": "0901000002", "piano_serial": "YM-U3-1995-002", "sale_date": date.today() - timedelta(days=210), "warranty_months": 12, "notes": "Chốt nhanh sau buổi test đàn"},
    {"customer_phone": "0901000016", "piano_serial": "YM-YUS5-2003-003", "sale_date": date.today() - timedelta(days=180), "warranty_months": 18, "notes": "Mẫu cao cấp hơn cho học nâng cao"},
    {"customer_phone": "0901000006", "piano_serial": "KW-K300-2019-004", "sale_date": date.today() - timedelta(days=120), "warranty_months": 12, "notes": "Đàn cho phòng khách"},
    {"customer_phone": "0901000015", "piano_serial": "KW-K500-2020-005", "sale_date": date.today() - timedelta(days=90), "warranty_months": 24, "notes": "Cần âm sáng và ổn định"},
    {"customer_phone": "0901000019", "piano_serial": "YM-GB1K-2015-015", "sale_date": date.today() - timedelta(days=75), "warranty_months": 24, "notes": "Khách có bé học piano"},
    {"customer_phone": "0901000005", "piano_serial": "YM-C3X-2024-026", "sale_date": date.today() - timedelta(days=60), "warranty_months": 12, "notes": "Xử lý lô hàng cuối"},
    {"customer_phone": "0901000025", "piano_serial": "YM-B3-2022-017", "sale_date": date.today() - timedelta(days=45), "warranty_months": 12, "notes": "Lead cũ chuyển đổi"},
    {"customer_phone": "0901000034", "piano_serial": "YM-U100-1998-024", "sale_date": date.today() - timedelta(days=40), "warranty_months": 18, "notes": "Trả góp"},
    {"customer_phone": "0901000003", "piano_serial": "KW-K15E-2023-016", "sale_date": date.today() - timedelta(days=28), "warranty_months": 12, "notes": "Piano cho bé mới học"},
    {"customer_phone": "0901000030", "piano_serial": "KW-K200-2018-025", "sale_date": date.today() - timedelta(days=20), "warranty_months": 24, "notes": "Khách trung thành"},
    {"customer_phone": "0901000008", "piano_serial": "YM-C1X-2021-037", "sale_date": date.today() - timedelta(days=15), "warranty_months": 12, "notes": "Mua grand cho phòng biểu diễn"},
    {"customer_phone": "0901000014", "piano_serial": "CS-AP470-2022-023", "sale_date": date.today() - timedelta(days=10), "warranty_months": 12, "notes": "Mẫu phổ thông"},
    {"customer_phone": "0901000012", "piano_serial": "BS-GP178PE-2017-021", "sale_date": date.today() - timedelta(days=7), "warranty_months": 18, "notes": "Khách tỉnh xa"},
    {"customer_phone": "0901000023", "piano_serial": "RL-LX708-2022-009", "sale_date": date.today() - timedelta(days=3), "warranty_months": 24, "notes": "Khách premium"},
    {"customer_phone": "0901000011", "piano_serial": "BS-UP118E-2016-008", "sale_date": date.today() - timedelta(days=1), "warranty_months": 36, "notes": "Đã giao cho trường nhạc"},
]


SERVICE_RECORDS = [
    {"customer_phone": "0901000001", "piano_serial": "YM-U1-1992-001", "service_date": date.today() - timedelta(days=300), "service_type": "Lên dây định kỳ", "description": "Kiểm tra toàn bộ hệ phím và pedal", "next_service_date": date.today() - timedelta(days=15), "status": ServiceStatus.COMPLETED, "notes": "Âm thanh ổn định"},
    {"customer_phone": "0901000001", "piano_serial": "YM-U1-1992-001", "service_date": date.today() - timedelta(days=110), "service_type": "Vệ sinh bộ máy", "description": "Có bụi nhẹ trong máy", "next_service_date": date.today() + timedelta(days=20), "status": ServiceStatus.COMPLETED, "notes": None},
    {"customer_phone": "0901000002", "piano_serial": "YM-U3-1995-002", "service_date": date.today() - timedelta(days=90), "service_type": "Điều chỉnh action", "description": "Phím nặng hơn bình thường", "next_service_date": date.today() + timedelta(days=30), "status": ServiceStatus.COMPLETED, "notes": "Đã bàn giao lại khách"},
    {"customer_phone": "0901000016", "piano_serial": "YM-YUS5-2003-003", "service_date": date.today() - timedelta(days=70), "service_type": "Kiểm tra pedal", "description": "Pedal sustain hơi lỏng", "next_service_date": date.today() + timedelta(days=50), "status": ServiceStatus.COMPLETED, "notes": None},
    {"customer_phone": "0901000006", "piano_serial": "KW-K300-2019-004", "service_date": date.today() - timedelta(days=55), "service_type": "Thay dây đàn", "description": "Dây bass xuống cấp", "next_service_date": date.today() + timedelta(days=60), "status": ServiceStatus.COMPLETED, "notes": "Đã thay xong"},
    {"customer_phone": "0901000015", "piano_serial": "KW-K500-2020-005", "service_date": date.today() - timedelta(days=45), "service_type": "Căn chỉnh và vệ sinh", "description": "Đàn cần vệ sinh tổng thể", "next_service_date": date.today() + timedelta(days=15), "status": ServiceStatus.SCHEDULED, "notes": "Hẹn lại tuần sau"},
    {"customer_phone": "0901000025", "piano_serial": "YM-B3-2022-017", "service_date": date.today() - timedelta(days=35), "service_type": "Kiểm tra âm thanh sau vận chuyển", "description": "Vận chuyển đường dài", "next_service_date": date.today() + timedelta(days=60), "status": ServiceStatus.COMPLETED, "notes": None},
    {"customer_phone": "0901000034", "piano_serial": "YM-U100-1998-024", "service_date": date.today() - timedelta(days=25), "service_type": "Lên dây định kỳ", "description": "Bảo trì sau 1 tháng sử dụng", "next_service_date": date.today() + timedelta(days=75), "status": ServiceStatus.IN_PROGRESS, "notes": "Đang chờ khách xác nhận giờ"},
    {"customer_phone": "0901000003", "piano_serial": "KW-K15E-2023-016", "service_date": date.today() - timedelta(days=18), "service_type": "Điều chỉnh action", "description": "Phím giữa hơi lệch", "next_service_date": date.today() + timedelta(days=90), "status": ServiceStatus.COMPLETED, "notes": None},
    {"customer_phone": "0901000030", "piano_serial": "KW-K200-2018-025", "service_date": date.today() - timedelta(days=14), "service_type": "Vệ sinh bộ máy", "description": "Vệ sinh tổng thể trước giao", "next_service_date": date.today() + timedelta(days=45), "status": ServiceStatus.COMPLETED, "notes": None},
    {"customer_phone": "0901000014", "piano_serial": "CS-AP470-2022-023", "service_date": date.today() - timedelta(days=12), "service_type": "Kiểm tra bàn phím", "description": "Phím bị kẹt nhẹ", "next_service_date": date.today() + timedelta(days=30), "status": ServiceStatus.COMPLETED, "notes": "Đã xử lý"},
    {"customer_phone": "0901000012", "piano_serial": "BS-GP178PE-2017-021", "service_date": date.today() - timedelta(days=9), "service_type": "Lên dây định kỳ", "description": "Kiểm tra lại sau giao hàng", "next_service_date": date.today() + timedelta(days=120), "status": ServiceStatus.SCHEDULED, "notes": None},
    {"customer_phone": "0901000023", "piano_serial": "RL-LX708-2022-009", "service_date": date.today() - timedelta(days=5), "service_type": "Kiểm tra pedal", "description": "Khách yêu cầu test nhanh", "next_service_date": date.today() + timedelta(days=180), "status": ServiceStatus.CANCELLED, "notes": "Khách dời lịch"},
    {"customer_phone": "0901000011", "piano_serial": "BS-UP118E-2016-008", "service_date": date.today() - timedelta(days=3), "service_type": "Căn chỉnh và vệ sinh", "description": "Đàn trưng bày mới giao", "next_service_date": date.today() + timedelta(days=90), "status": ServiceStatus.IN_PROGRESS, "notes": "Cần kiểm tra cuối ngày"},
    {"customer_phone": "0901000001", "piano_serial": "YM-U1-1992-001", "service_date": date.today() - timedelta(days=1), "service_type": "Kiểm tra âm thanh sau vận chuyển", "description": "Tiếng khá ổn", "next_service_date": date.today() + timedelta(days=365), "status": ServiceStatus.SCHEDULED, "notes": None},
]


CONVERSATIONS = [
    {"title": "Tư vấn Yamaha U1 và U3", "messages": [(MessageRole.USER, "Mình đang phân vân Yamaha U1 với U3, shop tư vấn giúp mình."), (MessageRole.ASSISTANT, "Yamaha U3 thường có chiều cao lớn hơn, âm lượng mạnh và dải động rộng hơn U1. Nếu phòng nhỏ và ngân sách vừa phải, U1 là lựa chọn an toàn. Nếu bạn cần âm dày và chơi lâu dài, U3 đáng cân nhắc."), (MessageRole.USER, "Phòng mình khoảng 20m2, người mới học thì nên chọn gì?"), (MessageRole.ASSISTANT, "Với phòng 20m2 và người mới học, U1 hoặc Kawai K-300 đều là lựa chọn cân bằng. Nếu thích âm sáng, chọn Yamaha. Nếu thích âm tròn và mềm hơn, chọn Kawai.")]},
    {"title": "Piano cho bé mới học", "messages": [(MessageRole.USER, "Con mình mới học piano, nên chọn đàn nào để tập ở nhà?"), (MessageRole.ASSISTANT, "Bạn nên ưu tiên đàn upright kích thước vừa, phím ổn định và âm lượng dễ kiểm soát. Yamaha U1, Kawai K-200 hoặc digital cao cấp như Roland HP704 đều hợp."), (MessageRole.USER, "Mình muốn đàn ít phải bảo trì thì sao?"), (MessageRole.ASSISTANT, "Nếu muốn ít bảo trì, đàn digital là phương án thuận tiện nhất. Nếu vẫn thích cảm giác phím cơ, hãy chọn đàn upright đã kiểm tra kỹ và lên dây định kỳ.")]},
    {"title": "Piano phòng nhỏ", "messages": [(MessageRole.USER, "Nhà mình là căn hộ nhỏ, có mẫu nào gọn không?"), (MessageRole.ASSISTANT, "Bạn có thể xem Kawai K-15E, Yamaha JU109 hoặc các mẫu digital mỏng như Casio PX-S7000. Chúng gọn và dễ bố trí trong căn hộ."), (MessageRole.USER, "Cần loại màu trắng có không?"), (MessageRole.ASSISTANT, "Có. Một số mẫu digital và một vài upright màu trắng hoặc trắng satin sẽ phù hợp nếu bạn muốn nội thất sáng.")]},
    {"title": "So sánh Kawai và Yamaha", "messages": [(MessageRole.USER, "Kawai và Yamaha khác nhau gì về âm thanh?"), (MessageRole.ASSISTANT, "Yamaha thường cho cảm giác sáng, rõ và nổi bật. Kawai thiên về âm ấm, mềm và dễ nghe khi chơi lâu."), (MessageRole.USER, "Có model nào tầm trung đáng mua không?"), (MessageRole.ASSISTANT, "Ở tầm trung, Yamaha U1/U3 và Kawai K-200/K-300 đều là lựa chọn rất phổ biến. Nên chọn theo không gian và gu âm thanh."), (MessageRole.USER, "Cảm ơn shop, mình sẽ ghé xem trực tiếp."), (MessageRole.ASSISTANT, "Rất vui được hỗ trợ. Khi ghé, bạn có thể thử nhiều model cùng phân khúc để cảm nhận rõ hơn.")]},
    {"title": "Lịch bảo trì piano", "messages": [(MessageRole.USER, "Bao lâu nên lên dây piano một lần?"), (MessageRole.ASSISTANT, "Thông thường 6–12 tháng nên lên dây một lần, tùy môi trường và tần suất sử dụng. Nếu phòng ẩm hoặc đàn dùng nhiều, có thể cần sớm hơn.")]},
    {"title": "Bảo quản piano mùa mưa", "messages": [(MessageRole.USER, "Mùa mưa mình cần lưu ý gì để bảo quản piano?"), (MessageRole.ASSISTANT, "Bạn nên giữ độ ẩm ổn định, dùng máy hút ẩm nếu cần và tránh đặt đàn sát tường ẩm. Nên kiểm tra định kỳ pedal, phím và âm thanh."), (MessageRole.USER, "Có cần vệ sinh thường xuyên không?"), (MessageRole.ASSISTANT, "Có. Lau bụi nhẹ bên ngoài thường xuyên và vệ sinh bên trong theo định kỳ sẽ giúp đàn bền hơn.")]},
    {"title": "Grand piano cho phòng biểu diễn", "messages": [(MessageRole.USER, "Mình cần grand piano cho phòng biểu diễn nhỏ thì nên xem mẫu nào?"), (MessageRole.ASSISTANT, "Bạn có thể bắt đầu từ Yamaha GB1K, C1X hoặc Kawai GL-10, GL-30. Đây là các model grand nhỏ gọn nhưng vẫn đủ lực âm cho phòng biểu diễn nhỏ."), (MessageRole.USER, "Có mẫu cao cấp hơn không?"), (MessageRole.ASSISTANT, "Nếu ngân sách lớn hơn, Yamaha C3X hoặc Steinway Model B là những lựa chọn rất mạnh về độ biểu cảm và độ phủ âm.")]},
    {"title": "Nhạc cụ cho trường học", "messages": [(MessageRole.USER, "Trường học cần mua vài cây piano, nên chọn dòng nào dễ bảo trì?"), (MessageRole.ASSISTANT, "Với môi trường trường học, nên ưu tiên model bền, dễ bảo trì và có nguồn linh kiện ổn định. Yamaha U1, U3 hoặc các digital chất lượng cao đều phù hợp."), (MessageRole.USER, "Cần bảng giá và lịch bảo trì định kỳ luôn."), (MessageRole.ASSISTANT, "Được, mình có thể chuẩn bị danh sách model, giá và lịch bảo trì đề xuất theo số lượng đàn.")]},
]


def _require_safe_environment() -> None:
    if not str(engine.url).startswith("sqlite"):
        raise SystemExit("Seed chỉ chạy với SQLite local")
    if os.environ.get("DEMO_SEED_ALLOW_RESET") != "1":
        raise SystemExit("Set DEMO_SEED_ALLOW_RESET=1 để cho phép reset dữ liệu local")


def _reset_demo_data() -> None:
    with SessionLocal() as db:
        db.execute(delete(AIMessage))
        db.execute(delete(AIConversation))
        db.execute(delete(ServiceRecord))
        db.execute(delete(Warranty))
        db.execute(delete(Sale))
        db.execute(delete(Lead))
        db.execute(delete(Piano))
        db.execute(delete(Customer))
        db.commit()


def _create_customers(service: CustomerService) -> list:
    return [service.create(CustomerCreate(**item)) for item in CUSTOMERS]


def _create_pianos(service: PianoService) -> list:
    return [service.create(PianoCreate(**item)) for item in PIANOS]


def _create_leads(service: LeadService) -> list:
    created = []
    for item in LEADS:
        created.append(
            service.create(
                LeadCreate(
                    customer=CustomerInput(name=item["name"], phone=item["phone"], address=item.get("address"), notes=None),
                    budget_min=item.get("budget_min"),
                    budget_max=item.get("budget_max"),
                    interested_brand=item.get("interested_brand"),
                    interested_model=item.get("interested_model"),
                    status=item["status"],
                    follow_up_date=item.get("follow_up_date"),
                    notes=item.get("notes"),
                )
            )
        )
    return created


def _create_sales(service: SaleService, customer_by_phone: dict[str, str], piano_by_serial: dict[str, str]) -> list:
    created = []
    for item in SALES:
        created.append(
            service.create(
                SaleCreate(
                    customer_id=customer_by_phone[item["customer_phone"]],
                    piano_id=piano_by_serial[item["piano_serial"]],
                    sale_date=item["sale_date"],
                    warranty_months=item["warranty_months"],
                    notes=item["notes"],
                )
            )
        )
    return created


def _create_services(service: MaintenanceService, customer_by_phone: dict[str, str], piano_by_serial: dict[str, str]) -> list:
    created = []
    for item in SERVICE_RECORDS:
        created.append(
            service.create(
                ServiceRecordCreate(
                    customer_id=customer_by_phone[item["customer_phone"]],
                    piano_id=piano_by_serial[item["piano_serial"]],
                    service_date=item["service_date"],
                    service_type=item["service_type"],
                    description=item["description"],
                    next_service_date=item["next_service_date"],
                    status=item["status"],
                    notes=item["notes"],
                )
            )
        )
    return created


def _create_ai_data(db) -> tuple[int, int]:
    conversations = 0
    messages = 0
    for spec in CONVERSATIONS:
        conversation = AIConversation(title=spec["title"])
        db.add(conversation)
        db.flush()
        conversations += 1
        for role, content in spec["messages"]:
            db.add(AIMessage(conversation_id=conversation.id, role=role, content=content))
            messages += 1
    db.commit()
    return conversations, messages


def main() -> None:
    _require_safe_environment()
    Base.metadata.create_all(bind=engine)
    _reset_demo_data()

    with SessionLocal() as db:
        customer_service = CustomerService(db)
        piano_service = PianoService(db)
        sale_service = SaleService(db)
        maintenance_service = MaintenanceService(db)
        lead_service = LeadService(db)

        customers = _create_customers(customer_service)
        pianos = _create_pianos(piano_service)
        customer_by_phone = {item.phone: item.id for item in customers}
        piano_by_serial = {item.serial_number: item.id for item in pianos if item.serial_number}
        leads = _create_leads(lead_service)
        sales = _create_sales(sale_service, customer_by_phone, piano_by_serial)
        services = _create_services(maintenance_service, customer_by_phone, piano_by_serial)
        conversations_count, messages_count = _create_ai_data(db)

    summary = SeedSummary(
        customers=len(customers),
        leads=len(leads),
        pianos=len(pianos),
        sales=len(sales),
        warranties=len(sales),
        services=len(services),
        conversations=conversations_count,
        messages=messages_count,
    )
    print(
        "Seed completed: "
        f"customers={summary.customers}, leads={summary.leads}, pianos={summary.pianos}, "
        f"sales={summary.sales}, warranties={summary.warranties}, services={summary.services}, "
        f"ai_conversations={summary.conversations}, ai_messages={summary.messages}"
    )


if __name__ == "__main__":
    main()
