"""Shared test client with an isolated SQLite database."""

from __future__ import annotations

import os
from pathlib import Path

TEST_DB = Path(__file__).resolve().parent / "test_incident.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["GROQ_API_KEY"] = ""
os.environ["APP_ENV"] = "test"

if TEST_DB.exists():
    TEST_DB.unlink()

from fastapi.testclient import TestClient  # noqa: E402
import pytest  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.init_db import init_db  # noqa: E402
from app.db.session import get_engine, reset_engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client() -> TestClient:
    get_settings.cache_clear()
    reset_engine()
    engine = get_engine()
    Base.metadata.drop_all(bind=engine)
    init_db()
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)
    reset_engine()
    if TEST_DB.exists():
        TEST_DB.unlink()
