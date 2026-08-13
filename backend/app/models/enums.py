from __future__ import annotations

from enum import StrEnum


class PianoType(StrEnum):
    UPRIGHT = "upright"
    GRAND = "grand"
    DIGITAL = "digital"


class PianoCondition(StrEnum):
    NEW = "new"
    USED = "used"


class PianoStatus(StrEnum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    INCOMING = "incoming"
    SOLD = "sold"
    PAUSED = "paused"
    OUT_OF_STOCK = "out_of_stock"
    SERVICE = "service"


class LeadStatus(StrEnum):
    NEW = "new"
    CONTACTED = "contacted"
    VISITED = "visited"
    CONSIDERING = "considering"
    CONVERTED = "converted"
    WON = "won"
    LOST = "lost"


class ServiceStatus(StrEnum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
