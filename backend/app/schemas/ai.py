from __future__ import annotations

import uuid

from pydantic import Field

from app.schemas.common import StrictModel


class AIChatRequest(StrictModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: uuid.UUID | None = None


class AIChatResponse(StrictModel):
    conversation_id: uuid.UUID
    answer: str
    tool_calls: list[str]
    model: str
    mode: str
