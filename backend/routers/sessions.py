from fastapi import APIRouter, Depends
from ..db.connection import get_db
from ..db.queries import get_sessions
from ..auth.jwt_handler import get_current_user

router = APIRouter()


@router.get('/sessions')
async def list_sessions(
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    sessions = await get_sessions(db, current_user['user_id'], limit=limit)
    return sessions
