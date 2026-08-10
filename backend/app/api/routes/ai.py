from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_ai_service
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=AIChatResponse)
def chat(
    payload: AIChatRequest,
    service: AIService = Depends(get_ai_service),
) -> AIChatResponse:
    return service.chat(payload)
