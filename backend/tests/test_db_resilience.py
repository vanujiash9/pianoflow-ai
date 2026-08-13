from __future__ import annotations

import threading
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.core.database import Base, get_db
from app.models.enums import PianoCondition, PianoStatus, PianoType
from app.models.sale import Sale
from app.models.warranty import Warranty
from app.schemas.customer import CustomerCreate
from app.schemas.piano import PianoCreate
from app.schemas.sale import SaleCreate
from app.services.sale_service import SaleService


def _postgres_test_url() -> str:
    return get_settings().database_url


def _is_postgres_test_url() -> bool:
    return _postgres_test_url().startswith("postgresql") and "test" in _postgres_test_url()


def _make_postgres_session_factory():
    engine = create_engine(_postgres_test_url(), pool_pre_ping=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False), engine


class _FailingSession:
    def __init__(self) -> None:
        self.rollback_called = False
        self.close_called = False

    def rollback(self) -> None:
        self.rollback_called = True

    def close(self) -> None:
        self.close_called = True

    def commit(self) -> None:
        raise Exception("commit failed")


def test_get_db_rolls_back_before_close(monkeypatch):
    session = _FailingSession()

    def fake_session_local():
        return session

    monkeypatch.setattr("app.core.database.SessionLocal", fake_session_local)

    dependency = get_db()
    yielded = next(dependency)
    assert yielded is session

    try:
        dependency.throw(RuntimeError("boom"))
    except RuntimeError:
        pass

    assert session.rollback_called is True
    assert session.close_called is True


def test_sale_service_rolls_back_when_commit_fails(db_session):
    service = SaleService(db_session)
    db_session.rollback_called = False
    original_rollback = db_session.rollback

    def tracked_rollback() -> None:
        db_session.rollback_called = True
        original_rollback()

    db_session.rollback = tracked_rollback  # type: ignore[method-assign]

    customer = service.customers.create(
        CustomerCreate(name="Khách", phone="0909000003", address="HCM", notes=None)
    )
    piano = service.pianos.create(
        PianoCreate(
            brand="Kawai",
            model="K-300",
            serial_number="ROLLBACK-001",
            piano_type=PianoType.UPRIGHT,
            size_cm=121,
            pedal_count=3,
            purchase_price=Decimal("100000000"),
            retail_price=Decimal("150000000"),
            status=PianoStatus.AVAILABLE,
            quantity=1,
            variant=None,
            arrival_date=None,
            color=None,
            condition=PianoCondition.USED,
            notes=None,
        )
    )
    db_session.commit()
    db_session.refresh(customer)
    db_session.refresh(piano)

    customer_id = customer.id
    piano_id = piano.id
    sale_date = customer.created_at.date()

    def fail_commit() -> None:
        raise Exception("commit failed")

    db_session.commit = fail_commit  # type: ignore[method-assign]

    payload = SaleCreate(
        customer_id=customer_id,
        piano_id=piano_id,
        sale_date=sale_date,
        warranty_months=12,
        notes=None,
    )

    try:
        service.create(payload)
    except Exception as exc:
        assert str(exc) == "commit failed"

    assert db_session.rollback_called is True


@pytest.mark.skipif(not _is_postgres_test_url(), reason="PostgreSQL test database not configured")
def test_concurrent_serialized_sale_only_allows_one_winner():
    session_factory, engine = _make_postgres_session_factory()
    try:
        setup_session = session_factory()
        service = SaleService(setup_session)
        customer = service.customers.create(
            CustomerCreate(name="Khách", phone="0909000101", address="HCM", notes=None)
        )
        piano = service.pianos.create(
            PianoCreate(
                brand="Kawai",
                model="K-300",
                serial_number="CONCURRENT-SERIAL-001",
                piano_type=PianoType.UPRIGHT,
                size_cm=121,
                pedal_count=3,
                purchase_price=Decimal("100000000"),
                retail_price=Decimal("150000000"),
                status=PianoStatus.AVAILABLE,
                quantity=1,
                variant=None,
                arrival_date=None,
                color=None,
                condition=PianoCondition.USED,
                notes=None,
            )
        )
        setup_session.commit()
        setup_session.close()

        ready = threading.Barrier(2)
        go = threading.Event()
        results: list[tuple[str, str | None]] = []

        def attempt_sale(name: str) -> None:
            session = session_factory()
            service = SaleService(session)
            try:
                ready.wait(timeout=10)
                go.wait(timeout=10)
                payload = SaleCreate(
                    customer_id=customer.id,
                    piano_id=piano.id,
                    sale_date=customer.created_at.date(),
                    warranty_months=12,
                    notes=None,
                )
                service.create(payload)
                session.commit()
                results.append((name, None))
            except Exception as exc:  # noqa: BLE001
                session.rollback()
                results.append((name, str(exc)))
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(attempt_sale, label) for label in ("first", "second")]
            go.set()
            for future in futures:
                future.result()

        verifier = session_factory()
        try:
            sales = verifier.query(Sale).all()
            warranties = verifier.query(Warranty).all()
            refreshed = verifier.get(type(piano), piano.id)
        finally:
            verifier.close()

        assert len(results) == 2
        assert sum(1 for _, error in results if error is None) == 1
        assert sum(1 for _, error in results if error is not None) == 1
        assert len(sales) == 1
        assert len(warranties) == 1
        assert refreshed.status == PianoStatus.SOLD
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.mark.skipif(not _is_postgres_test_url(), reason="PostgreSQL test database not configured")
def test_concurrent_quantity_sale_only_decrements_to_zero():
    session_factory, engine = _make_postgres_session_factory()
    try:
        setup_session = session_factory()
        service = SaleService(setup_session)
        customer = service.customers.create(
            CustomerCreate(name="Khách", phone="0909000102", address="HCM", notes=None)
        )
        piano = service.pianos.create(
            PianoCreate(
                brand="Yamaha",
                model="NU1",
                serial_number=None,
                piano_type=PianoType.DIGITAL,
                size_cm=121,
                pedal_count=3,
                purchase_price=Decimal("50000000"),
                retail_price=Decimal("80000000"),
                status=PianoStatus.AVAILABLE,
                quantity=1,
                variant=None,
                arrival_date=None,
                color=None,
                condition=PianoCondition.USED,
                notes=None,
            )
        )
        setup_session.commit()
        setup_session.close()

        ready = threading.Barrier(2)
        go = threading.Event()
        results: list[tuple[str, str | None]] = []

        def attempt_sale(name: str) -> None:
            session = session_factory()
            service = SaleService(session)
            try:
                ready.wait(timeout=10)
                go.wait(timeout=10)
                payload = SaleCreate(
                    customer_id=customer.id,
                    piano_id=piano.id,
                    sale_date=customer.created_at.date(),
                    warranty_months=12,
                    notes=None,
                )
                service.create(payload)
                session.commit()
                results.append((name, None))
            except Exception as exc:  # noqa: BLE001
                session.rollback()
                results.append((name, str(exc)))
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(attempt_sale, label) for label in ("first", "second")]
            go.set()
            for future in futures:
                future.result()

        verifier = session_factory()
        try:
            refreshed = verifier.get(type(piano), piano.id)
            sales = verifier.query(Sale).all()
            warranties = verifier.query(Warranty).all()
        finally:
            verifier.close()

        assert len(results) == 2
        assert sum(1 for _, error in results if error is None) == 1
        assert sum(1 for _, error in results if error is not None) == 1
        assert refreshed.quantity == 0
        assert refreshed.status == PianoStatus.OUT_OF_STOCK
        assert len(sales) == 1
        assert len(warranties) == 1
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()
