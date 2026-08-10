from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage
from app.models.enums import MessageRole


class AIConversationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create(self, conversation_id: uuid.UUID | None, first_message: str) -> AIConversation:
        if conversation_id:
            existing = self.db.get(AIConversation, conversation_id)
            if existing:
                return existing
        conversation = AIConversation(title=first_message[:80])
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def history(self, conversation_id: uuid.UUID, limit: int = 16) -> list[AIMessage]:
        stmt = (
            select(AIMessage)
            .where(AIMessage.conversation_id == conversation_id)
            .order_by(AIMessage.created_at.desc())
            .limit(limit)
        )
        items = list(self.db.scalars(stmt).all())
        return list(reversed(items))

    def add_message(self, conversation_id: uuid.UUID, role: MessageRole, content: str) -> AIMessage:
        message = AIMessage(conversation_id=conversation_id, role=role, content=content)
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
