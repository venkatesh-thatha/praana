import httpx
import time
import logging
from ..config import get_settings

logger = logging.getLogger(__name__)

_token_cache: dict = {'token': None, 'expires_at': 0}


async def _get_token() -> str:
    if _token_cache['token'] and time.time() < _token_cache['expires_at']:
        return _token_cache['token']
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            'https://icdaccessmanagement.who.int/connect/token',
            data={
                'grant_type': 'client_credentials',
                'client_id': settings.icd11_client_id,
                'client_secret': settings.icd11_client_secret,
                'scope': 'icdapi_access',
            },
        )
        resp.raise_for_status()
        data = resp.json()
        _token_cache['token'] = data['access_token']
        _token_cache['expires_at'] = time.time() + data.get('expires_in', 3600) - 60
        return _token_cache['token']


async def query_icd11(symptoms: list[dict]) -> list[dict]:
    """Query ICD-11 API for candidate conditions. Falls back to empty list on any error."""
    try:
        token = await _get_token()
        symptom_text = ' '.join([s.get('description', '') for s in symptoms if s.get('description')])
        if not symptom_text.strip():
            return []
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                'https://id.who.int/icd/entity/search',
                params={
                    'q': symptom_text,
                    'subtreesFilter': 'http://id.who.int/icd/entity/448895267',
                    'includeKeywordResult': 'true',
                    'useFlexisearch': 'true',
                    'flatResults': 'true',
                    'highlightingEnabled': 'false',
                    'medicalCodingMode': 'true',
                },
                headers={
                    'Authorization': f'Bearer {token}',
                    'Accept': 'application/json',
                    'Accept-Language': 'en',
                    'API-Version': 'v2',
                },
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            candidates = []
            for item in data.get('destinationEntities', [])[:10]:
                candidates.append({
                    'icd_code': item.get('theCode', ''),
                    'name': item.get('title', ''),
                    'icd_url': item.get('id', ''),
                })
            return candidates
    except Exception as e:
        logger.warning('ICD-11 API error: %s — returning empty candidates for Claude-only ranking', e)
        return []
