from __future__ import annotations

from enum import Enum


class PianoType(str, Enum):
    UPRIGHT = "upright"
    GRAND = "grand"
    DIGITAL = "digital"


class PianoCondition(str, Enum):
    NEW = "new"
    USED = "used"


class PianoStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    INCOMING = "incoming"
    SOLD = "sold"
    PAUSED = "paused"
    OUT_OF_STOCK = "out_of_stock"
    SERVICE = "service"


class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    VISITED = "visited"
    CONSIDERING = "considering"
    CONVERTED = "converted"
    WON = "won"
    LOST = "lost"


class ServiceStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
