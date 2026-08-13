from __future__ import annotations

import logging
import time

from sqlalchemy.orm import Session

from app.ai.agent import ShopAgent
from app.core.config import get_settings
from app.models.enums import MessageRole
from app.repositories.ai_repository import AIConversationRepository
from app.models.ai_conversation import AIConversation
from app.schemas.ai import AIChatRequest, AIChatResponse, AIConversationRead, AIMessageRead

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self.conversations = AIConversationRepository(db)

    def get_conversation(self, conversation_id: uuid.UUID) -> AIConversationRead:
        conversation = self.db.get(AIConversation, conversation_id)
        if conversation is None:
            raise KeyError(str(conversation_id))

        messages = self.conversations.history(conversation_id, limit=self.settings.ai_history_limit)
        return AIConversationRead(
            conversation_id=conversation.id,
            title=conversation.title,
            messages=[AIMessageRead(role=item.role.value, content=item.content) for item in messages],
        )

    def chat(self, payload: AIChatRequest) -> AIChatResponse:
        started_at = time.perf_counter()
        conversation = self.conversations.get_or_create(payload.conversation_id, payload.message)
        self.conversations.add_message(conversation.id, MessageRole.USER, payload.message)
        history = self.conversations.history(conversation.id, limit=self.settings.ai_history_limit)
        logger.info(
            "ai_chat load_history conversation_id=%s history_count=%s history_limit=%s",
            conversation.id,
            len(history),
            self.settings.ai_history_limit,
        )

        if not self.settings.llm_enabled or not self.settings.llm_model or not self.settings.llm_api_key:
            answer = (
                "AI Assistant đang tắt. Hãy cấu hình LLM_ENABLED=true, LLM_BASE_URL, "
                "LLM_API_KEY và LLM_MODEL trong backend/.env."
            )
            self.conversations.add_message(conversation.id, MessageRole.ASSISTANT, answer)
            elapsed_ms = (time.perf_counter() - started_at) * 1000
            logger.info(
                "ai_chat completed conversation_id=%s mode=disabled model=disabled history_count=%s tool_calls=%s elapsed_ms=%.2f",
                conversation.id,
                1,
                0,
                elapsed_ms,
            )
            return AIChatResponse(
                conversation_id=conversation.id,
                answer=answer,
                tool_calls=[],
                model="disabled",
                mode="disabled",
            )

        logger.info(
            "ai_chat start conversation_id=%s model=%s history_count=%s history_limit=%s",
            conversation.id,
            self.settings.llm_model,
            len(history),
            self.settings.ai_history_limit,
        )
        messages = [{"role": item.role.value, "content": item.content} for item in history]
        agent_started_at = time.perf_counter()
        agent = ShopAgent(self.db, self.settings)
        answer, tool_calls, mode = agent.invoke(messages)
        agent_elapsed_ms = (time.perf_counter() - agent_started_at) * 1000
        self.conversations.add_message(conversation.id, MessageRole.ASSISTANT, answer)
        elapsed_ms = (time.perf_counter() - started_at) * 1000
        logger.info(
            "ai_chat completed conversation_id=%s mode=%s model=%s history_count=%s tool_calls=%s agent_elapsed_ms=%.2f elapsed_ms=%.2f",
            conversation.id,
            mode,
            self.settings.llm_model,
            len(history),
            len(tool_calls),
            agent_elapsed_ms,
            elapsed_ms,
        )
        return AIChatResponse(
            conversation_id=conversation.id,
            answer=answer,
            tool_calls=tool_calls,
            model=self.settings.llm_model,
            mode=mode,
        )
