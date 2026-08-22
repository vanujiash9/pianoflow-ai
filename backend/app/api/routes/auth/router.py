from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status

from app.api.deps import get_auth_service, get_current_user
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return service.login(payload, response)


@router.get("/me", response_model=AuthResponse)
def me(request: Request, service: AuthService = Depends(get_auth_service)) -> AuthResponse:
    return AuthResponse(user=service.current_user(request))


@router.post("/register", response_model=AuthResponse)
def register(
    payload: RegisterRequest,
    current_user=Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return service.register(payload, current_user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
def logout(response: Response, service: AuthService = Depends(get_auth_service)) -> None:
    service.logout(response)
