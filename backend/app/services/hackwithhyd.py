"""Optional HackWithHyd client. No-ops until credentials are provided."""

from app.core.config import get_settings


class HackWithHydClient:
    def configured(self) -> bool:
        settings = get_settings()
        return bool(settings.hackwithhyd_api_key and settings.hackwithhyd_base_url)

    def status(self) -> dict:
        if not self.configured():
            return {
                "configured": False,
                "message": "HACKWITHHYD_API_KEY / HACKWITHHYD_BASE_URL are not set",
            }
        return {
            "configured": True,
            "base_url": get_settings().hackwithhyd_base_url,
            "message": "Credentials present; live integration is not wired yet",
        }


hackwithhyd_client = HackWithHydClient()
