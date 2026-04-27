from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).parent / '.env'


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


@lru_cache
def get_settings() -> Settings:
    return Settings()
