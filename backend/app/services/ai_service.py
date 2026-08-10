from __future__ import annotations

from sqlalchemy.orm import Session

from app.ai.agent import ShopAgent
from app.core.config import get_settings
from app.models.enums import MessageRole
from app.repositories.ai_repository import AIConversationRepository
from app.schemas.ai import AIChatRequest, AIChatResponse


class AIService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self.conversations = AIConversationRepository(db)

    def chat(self, payload: AIChatRequest) -> AIChatResponse:
        conversation = self.conversations.get_or_create(payload.conversation_id, payload.message)
        self.conversations.add_message(conversation.id, MessageRole.USER, payload.message)

        if not self.settings.llm_enabled or not self.settings.llm_model or not self.settings.llm_api_key:
            answer = (
                "AI Assistant đang tắt. Hãy cấu hình LLM_ENABLED=true, LLM_BASE_URL, "
                "LLM_API_KEY và LLM_MODEL trong backend/.env."
            )
            self.conversations.add_message(conversation.id, MessageRole.ASSISTANT, answer)
            return AIChatResponse(
                conversation_id=conversation.id,
                answer=answer,
                tool_calls=[],
                model="disabled",
                mode="disabled",
            )

        history = self.conversations.history(conversation.id, limit=16)
        messages = [{"role": item.role.value, "content": item.content} for item in history]
        agent = ShopAgent(self.db, self.settings)
        answer, tool_calls, mode = agent.invoke(messages)
        self.conversations.add_message(conversation.id, MessageRole.ASSISTANT, answer)
        return AIChatResponse(
            conversation_id=conversation.id,
            answer=answer,
            tool_calls=tool_calls,
            model=self.settings.llm_model,
            mode=mode,
        )
