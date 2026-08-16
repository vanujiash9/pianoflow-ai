from __future__ import annotations

from pathlib import Path


def test_seed_script_stays_local_only():
    source = Path(__file__).resolve().parents[2] / "scripts" / "seed.py"
    text = source.read_text(encoding="utf-8")
    assert "sqlite" in text
    assert "DEMO_SEED_ALLOW_RESET" in text
    assert "drop_all" not in text
