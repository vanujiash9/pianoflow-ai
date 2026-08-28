from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def test_demo_seed_script_mentions_local_only_reset():
    seed_path = Path(__file__).resolve().parents[2] / "scripts" / "seed.py"
    source = seed_path.read_text(encoding="utf-8")
    assert "DEMO_SEED_ALLOW_RESET" in source
    assert "Seed completed:" in source
    assert "sqlite" in source
    assert "Seed chỉ chạy với SQLite local" in source


def test_demo_seed_script_blocks_non_local_databases(tmp_path):
    seed_path = Path(__file__).resolve().parents[2] / "scripts" / "seed.py"
    env = os.environ.copy()
    env["DEMO_SEED_ALLOW_RESET"] = "1"
    env["DATABASE_URL"] = "postgresql+psycopg://example"
    env["PYTHONPATH"] = str(seed_path.parents[1])
    result = subprocess.run(
        [sys.executable, str(seed_path)],
        cwd=tmp_path,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode != 0
    assert "Seed chỉ chạy với SQLite local" in result.stderr or "Seed chỉ chạy với SQLite local" in result.stdout
