from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_customer_service
from app.schemas.customer import CustomerCreate, CustomerProfile, CustomerRead, CustomerUpdate
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=list[CustomerRead])
def list_customers(
    search: str | None = Query(default=None, max_length=120),
    service: CustomerService = Depends(get_customer_service),
) -> list[CustomerRead]:
    return service.list(search)


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(
    customer_id: uuid.UUID,
    service: CustomerService = Depends(get_customer_service),
) -> CustomerRead:
    return service.get(customer_id)


@router.get("/{customer_id}/profile", response_model=CustomerProfile)
def get_customer_profile(
    customer_id: uuid.UUID,
    service: CustomerService = Depends(get_customer_service),
) -> CustomerProfile:
    return service.profile(customer_id)


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    service: CustomerService = Depends(get_customer_service),
) -> CustomerRead:
    return service.create(payload)


@router.patch("/{customer_id}", response_model=CustomerRead)
def update_customer(
    customer_id: uuid.UUID,
    payload: CustomerUpdate,
    service: CustomerService = Depends(get_customer_service),
) -> CustomerRead:
    return service.update(customer_id, payload)
