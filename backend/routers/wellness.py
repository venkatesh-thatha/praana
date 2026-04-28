from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from ..db.connection import get_db
from ..db.queries import get_profile
from ..auth.jwt_handler import get_current_user
from ..services.claude_service import generate_wellness_content

router = APIRouter()

_cache: dict = {}

_FALLBACK_PROFILE = {
    'personal': {'name': 'User', 'age': None, 'gender': None, 'city': None, 'state': 'India'},
    'medical_history': {'conditions': [], 'medications': []},
    'lifestyle': {'diet_type': 'mixed'},
}


@router.get('/today')
async def get_today_wellness(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    cache_key = f'{user_id}:{date.today().isoformat()}'

    if cache_key in _cache:
        return _cache[cache_key]

    profile = await get_profile(db, user_id) or _FALLBACK_PROFILE

    try:
        result = await generate_wellness_content(profile)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Wellness content generation failed: {str(e)}')

    _cache[cache_key] = result
    return result
