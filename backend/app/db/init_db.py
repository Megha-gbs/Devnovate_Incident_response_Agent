"""Create tables on startup."""

from app.db.base import Base
from app.db.session import get_engine
from app.models import action, incident, timeline  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=get_engine())
