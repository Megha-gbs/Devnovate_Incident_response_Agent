"""Mock tool and remediation tests."""

from app.core.exceptions import ActionNotAllowedError
from app.core.security import assert_action_allowed
from app.services.simulation import simulation_store
from app.tools.log_search import search_logs
from app.tools.remediation import run_remediation
from app.tools.service_status import get_service_status
import pytest


def test_search_logs_payment_outage() -> None:
    world = simulation_store.attach("INC-TEST01", "payment-api-outage")
    logs = search_logs("INC-TEST01", "payment-api-outage", query="503")
    assert logs
    assert any("503" in row["message"] for row in logs)
    assert world.scenario_id == "payment-api-outage"


def test_service_status_known() -> None:
    simulation_store.attach("INC-TEST02", "payment-api-outage")
    status = get_service_status("INC-TEST02", "payment-api-outage", "payment-api")
    assert status["found"] is True
    assert status["status"] == "degraded"


def test_unknown_action_blocked() -> None:
    with pytest.raises(ActionNotAllowedError):
        assert_action_allowed("rm -rf /")


def test_failed_execution_unknown_service() -> None:
    simulation_store.attach("INC-TEST03", "payment-api-outage")
    result = run_remediation("INC-TEST03", "payment-api-outage", "restart_service", "not-a-service")
    assert result["ok"] is False
    assert result["executed"] is False


def test_successful_db_pool_recovery() -> None:
    simulation_store.attach("INC-TEST04", "payment-api-outage")
    result = run_remediation(
        "INC-TEST04", "payment-api-outage", "increase_db_pool", "payments-db"
    )
    assert result["ok"] is True
    status = get_service_status("INC-TEST04", "payment-api-outage", "payment-api")
    assert status["status"] == "healthy"
