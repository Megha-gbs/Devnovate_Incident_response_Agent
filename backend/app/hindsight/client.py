import os
import atexit
from typing import Optional
from dotenv import load_dotenv
from hindsight_client import Hindsight

load_dotenv()

DEFAULT_BANK_ID = "org-incident-memory"
DEFAULT_BASE_URL = "https://api.hindsight.vectorize.io"

BASE_URL = os.environ.get("HINDSIGHT_BASE_URL", DEFAULT_BASE_URL)
API_KEY = os.environ.get("HINDSIGHT_API_KEY")
BANK_ID = os.environ.get("HINDSIGHT_BANK_ID", DEFAULT_BANK_ID)

_client_instance: Optional[Hindsight] = None


def get_hindsight_client() -> Hindsight:
    """
    Returns a singleton instance of the Hindsight client.
    Raises ValueError if HINDSIGHT_API_KEY is not set.
    """
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    current_api_key = os.environ.get("HINDSIGHT_API_KEY") or API_KEY
    current_base_url = os.environ.get("HINDSIGHT_BASE_URL") or BASE_URL

    if not current_api_key:
        raise ValueError("HINDSIGHT_API_KEY environment variable is not configured.")

    _client_instance = Hindsight(
        base_url=current_base_url,
        api_key=current_api_key
    )
    return _client_instance


def close_hindsight_client() -> None:
    """
    Safely closes the underlying HTTP session of the Hindsight client to avoid unclosed connectors.
    """
    global _client_instance
    if _client_instance is not None:
        try:
            _client_instance.close()
        except Exception:
            pass
        finally:
            _client_instance = None


# Automatically clean up resources on process exit
atexit.register(close_hindsight_client)

# Backwards compatibility export
try:
    if API_KEY:
        client = get_hindsight_client()
    else:
        client = None
except Exception:
    client = None