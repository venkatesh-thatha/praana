import io
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ..db.connection import get_db
from ..db.queries import get_profile, get_vitals_history, get_food_logs, save_brief, get_brief
from ..auth.jwt_handler import get_current_user
from ..services.claude_service import generate_brief
from ..services.brief_generator import build_pdf

router = APIRouter()


@router.post('/generate')
async def generate(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    session_id = body.get('session_id')
    if not session_id:
        raise HTTPException(status_code=400, detail='session_id is required')

    session = await db['sessions'].find_one({'session_id': session_id, 'user_id': user_id}, {'_id': 0})
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')

    profile = await get_profile(db, user_id) or {}
    vitals_30d = await get_vitals_history(db, user_id, days=30)
    food_7d = await get_food_logs(db, user_id, days=7)

    all_data = {
        'profile': profile,
        'session': session,
        'vitals_30d': vitals_30d,
        'food_7d': food_7d,
    }

    brief_data = await generate_brief(all_data)
    pdf_bytes = build_pdf(brief_data, profile)

    brief_id = str(uuid.uuid4())
    await save_brief(db, {
        'brief_id': brief_id,
        'user_id': user_id,
        'session_id': session_id,
        'created_at': datetime.now(timezone.utc),
        'brief_data': brief_data,
        'pdf_stored': True,
    })

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="praana_brief_{brief_id}.pdf"'},
    )


@router.get('/{brief_id}')
async def get_brief_record(
    brief_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    brief = await get_brief(db, brief_id)
    if not brief:
        raise HTTPException(status_code=404, detail='Brief not found')
    if brief.get('user_id') != current_user['user_id']:
        raise HTTPException(status_code=403, detail='Forbidden')
    return brief
