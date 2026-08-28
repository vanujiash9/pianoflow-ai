from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import DBAPIError, SQLAlchemyError

import app.models  # noqa: F401
from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError

logger = logging.getLogger(__name__)

settings = get_settings()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "Piano shop customer, inventory, warranty, maintenance and AI assistant API. "
        "Use Swagger to test each endpoint."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NotFoundError)
def handle_not_found(_: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
def handle_conflict(_: Request, exc: ConflictError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})


@app.exception_handler(BusinessRuleError)
def handle_business_rule(_: Request, exc: BusinessRuleError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": str(exc)})


@app.exception_handler(SQLAlchemyError)
def handle_database_error(_: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("Database error while handling request", exc_info=exc)
    if isinstance(exc, DBAPIError) and exc.connection_invalidated:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "Cơ sở dữ liệu tạm thời không khả dụng"},
        )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Cơ sở dữ liệu tạm thời không khả dụng"},
    )


app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"message": "PianoFlow API", "docs": "/docs"}
