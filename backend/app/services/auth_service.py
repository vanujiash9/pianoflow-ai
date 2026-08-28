from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, AuthUser, LoginRequest, RegisterRequest
from app.utils.auth import COOKIE_NAME, create_session_token, hash_password, verify_password, verify_session_token


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = UserRepository(db)

    def login(self, payload: LoginRequest, response: Response) -> AuthResponse:
        user = self.repo.get_by_username(payload.username)
        if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sai tài khoản hoặc mật khẩu")

        user.last_login_at = datetime.now(timezone.utc)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        settings = get_settings()
        response.set_cookie(
            key=COOKIE_NAME,
            value=create_session_token(str(user.id)),
            httponly=True,
            secure=settings.auth_cookie_secure,
            samesite="lax",
            max_age=60 * 60 * 12,
            path="/",
        )
        return AuthResponse(user=AuthUser.model_validate(user))

    def current_user(self, request: Request) -> User:
        token = request.cookies.get(COOKIE_NAME)
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa đăng nhập")
        user_id = verify_session_token(token)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa đăng nhập")
        user = self.repo.get(uuid.UUID(user_id))
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa đăng nhập")
        return user

    def register(self, payload: RegisterRequest, current_user: User) -> AuthResponse:
        if current_user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không đủ quyền")
        if not verify_password(payload.current_password, current_user.password_hash):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Mật khẩu admin không đúng")
        if self.repo.get_by_username(payload.username):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tài khoản đã tồn tại")

        user = self.repo.create(
            username=payload.username,
            password_hash=hash_password(payload.password),
            role="staff",
        )
        self.db.commit()
        self.db.refresh(user)
        return AuthResponse(user=AuthUser.model_validate(user))

    def logout(self, response: Response) -> None:
        response.delete_cookie(COOKIE_NAME, path="/")
