from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def test_demo_seed_script_runs_against_local_sqlite(db_session):
    seed_path = Path(__file__).resolve().parents[2] / "scripts" / "seed.py"
    source = seed_path.read_text(encoding="utf-8")
    assert "DEMO_SEED_ALLOW_RESET" in source
    assert "Seed completed:" in source

    env = os.environ.copy()
    env["DEMO_SEED_ALLOW_RESET"] = "1"
    env["PYTHONPATH"] = str(seed_path.parents[1])
    result = subprocess.run(
        [sys.executable, str(seed_path)],
        cwd=seed_path.parents[1],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "Seed completed:" in result.stdout
