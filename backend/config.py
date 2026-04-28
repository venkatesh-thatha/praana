import logging
import sys
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).parent / '.env'
logger = logging.getLogger(__name__)

_PLACEHOLDER_HOSTNAME = 'cluster.mongodb.net'


class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_db_name: str = 'praana'
    jwt_secret: str
    jwt_algorithm: str = 'HS256'
    jwt_expire_minutes: int = 60 * 24
    anthropic_api_key: str
    icd11_client_id: str
    icd11_client_secret: str
    openfda_api_key: str = ''
    openaq_api_key: str = ''
    frontend_url: str = 'http://localhost:5173'

    model_config = SettingsConfigDict(env_file=_ENV_FILE)

    def validate_mongo_uri(self) -> None:
        from urllib.parse import urlparse
        hostname = urlparse(self.mongodb_uri).hostname or ''
        if hostname == _PLACEHOLDER_HOSTNAME:
            msg = (
                "ERROR: MONGODB_URI contains placeholder hostname 'cluster.mongodb.net'.\n"
                "Update backend/.env with your real Atlas cluster URL.\n"
                "Example: mongodb+srv://user:pass@cluster0.abcde.mongodb.net/praana\n"
                "Find it in Atlas → Connect → Drivers → copy the SRV connection string."
            )
            logger.critical(msg)
            sys.exit(1)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_mongo_uri()
    return settings
