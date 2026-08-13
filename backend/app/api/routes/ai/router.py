from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_ai_service
from app.schemas.ai import AIChatRequest, AIChatResponse, AIConversationRead
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.get("/conversations/{conversation_id}", response_model=AIConversationRead)
def get_conversation(
    conversation_id: UUID,
    service: AIService = Depends(get_ai_service),
) -> AIConversationRead:
    try:
        return service.get_conversation(conversation_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found") from exc


@router.post("/chat", response_model=AIChatResponse)
def chat(
    payload: AIChatRequest,
    service: AIService = Depends(get_ai_service),
) -> AIChatResponse:
    return service.chat(payload)
