import json
import os
from fastapi import APIRouter, Depends
from ..db.connection import get_db
from ..db.queries import get_profile, get_vitals_history, get_sessions
from ..auth.jwt_handler import get_current_user
from ..services.claude_service import recommend_exercise

router = APIRouter()


def _load_exercise_library() -> list[dict]:
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'exercise_library.json')
    if os.path.exists(data_path):
        with open(data_path) as f:
            return json.load(f)
    return []


@router.post('/recommend')
async def recommend(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    profile = await get_profile(db, user_id) or {}
    vitals = await get_vitals_history(db, user_id, days=7)
    sessions = await get_sessions(db, user_id, limit=3)

    conditions = profile.get('medical_history', {}).get('conditions', [])
    conditions_lower = [c.lower() for c in conditions]

    library = _load_exercise_library()
    filtered = [
        ex for ex in library
        if not any(
            ci.lower() in conditions_lower
            for ci in ex.get('contraindications', [])
        )
    ]

    symptom_context = sessions[0] if sessions else {}
    result = await recommend_exercise(profile, vitals, symptom_context, filtered)
    return result
