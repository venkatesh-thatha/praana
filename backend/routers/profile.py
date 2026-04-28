from fastapi import APIRouter, Depends, HTTPException
from ..db.connection import get_db
from ..db.queries import upsert_profile, get_profile
from ..auth.jwt_handler import get_current_user
from ..models.user import ProfileCreateRequest

router = APIRouter()


@router.post('')
async def create_or_update_profile(
    body: ProfileCreateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    await upsert_profile(db, user_id, body.model_dump(mode='json', exclude_none=True))
    return {'message': 'Profile saved', 'user_id': user_id}


@router.get('/me')
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Fetch the authenticated user's own profile. Used by Dashboard."""
    user_id = current_user['user_id']
    profile = await get_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')
    return profile


@router.get('/{user_id}')
async def get_user_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    profile = await get_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')
    return profile


@router.patch('/{user_id}')
async def patch_profile(
    user_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    if current_user['user_id'] != user_id:
        raise HTTPException(status_code=403, detail='Forbidden')
    await upsert_profile(db, user_id, body)
    return {'message': 'Profile updated'}
