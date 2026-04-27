import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from ..db.connection import get_db
from ..db.queries import get_profile, save_session
from ..auth.jwt_handler import get_current_user
from ..services.claude_service import analyze_symptoms, rank_conditions
from ..services.icd11_service import query_icd11

router = APIRouter()

RED_FLAG_MESSAGE = (
    'These symptoms may indicate a medical emergency. '
    'Call emergency services (112) or go to the nearest hospital IMMEDIATELY. '
    'Do not wait or self-medicate.'
)


@router.post('/analyze')
async def analyze(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    symptom_text = body.get('symptom_text', '').strip()
    language = body.get('language', 'en')

    if not symptom_text:
        raise HTTPException(status_code=400, detail='symptom_text is required')

    profile = await get_profile(db, user_id) or {}

    extracted = await analyze_symptoms(symptom_text, language, profile)

    red_flag = extracted.get('overall_severity') == 'emergency'
    session_id = str(uuid.uuid4())

    if red_flag:
        session = {
            'session_id': session_id,
            'user_id': user_id,
            'created_at': datetime.now(timezone.utc),
            'symptom_text': symptom_text,
            'language': language,
            'extracted_symptoms': extracted.get('symptoms', []),
            'red_flag': True,
            'red_flag_message': RED_FLAG_MESSAGE,
            'ranked_conditions': [],
            'doctor_talking_points': [],
            'brief_generated': False,
        }
        await save_session(db, session)
        return {
            'session_id': session_id,
            'shortlist': [],
            'red_flag': True,
            'red_flag_message': RED_FLAG_MESSAGE,
            'doctor_talking_points': [],
        }

    icd_candidates = await query_icd11(extracted.get('symptoms', []))
    ranked = await rank_conditions(icd_candidates, profile)

    session = {
        'session_id': session_id,
        'user_id': user_id,
        'created_at': datetime.now(timezone.utc),
        'symptom_text': symptom_text,
        'language': language,
        'extracted_symptoms': extracted.get('symptoms', []),
        'red_flag': False,
        'red_flag_message': None,
        'ranked_conditions': ranked.get('ranked_conditions', []),
        'doctor_talking_points': ranked.get('doctor_talking_points', []),
        'brief_generated': False,
    }
    await save_session(db, session)

    return {
        'session_id': session_id,
        'shortlist': ranked.get('ranked_conditions', []),
        'red_flag': False,
        'red_flag_message': None,
        'doctor_talking_points': ranked.get('doctor_talking_points', []),
    }
