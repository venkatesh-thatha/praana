import re
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from ..db.connection import get_db
from ..db.queries import get_profile, log_food, get_food_logs
from ..auth.jwt_handler import get_current_user
from ..services.claude_service import analyze_diet
from ..services.ifct_service import lookup_batch

router = APIRouter()


def _extract_food_names(food_log_text: str) -> list[str]:
    """
    Heuristically extract individual food item names from a free-text food log.
    Splits on commas, newlines, and 'and' connectors, then strips quantities/units.
    """
    # Split on common separators
    parts = re.split(r'[,\n;]|\band\b', food_log_text, flags=re.IGNORECASE)
    # Remove quantity words and digits, strip whitespace
    quantity_pattern = re.compile(
        r'\b(\d+[\s]*(g|kg|ml|l|cups?|tbsp|tsp|pieces?|bowls?|plates?|servings?|glasses?)?)\b',
        re.IGNORECASE,
    )
    cleaned = []
    for part in parts:
        name = quantity_pattern.sub('', part).strip(' .-\t')
        if name and len(name) > 2:
            cleaned.append(name)
    return cleaned[:20]  # cap at 20 items to keep context size sane


@router.post('/log')
async def log_food_entry(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    food_log_text = body.get('food_log_text', '').strip()
    date = body.get('date', datetime.now(timezone.utc).date().isoformat())
    if not food_log_text:
        raise HTTPException(status_code=400, detail='food_log_text is required')
    log_id = str(uuid.uuid4())
    await log_food(db, {
        'log_id': log_id,
        'user_id': user_id,
        'date': date,
        'food_log_text': food_log_text,
        'created_at': datetime.now(timezone.utc),
    })
    return {'log_id': log_id, 'message': 'Food log saved'}


@router.post('/analyze')
async def analyze(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    food_log_text = body.get('food_log_text', '').strip()
    date = body.get('date', datetime.now(timezone.utc).date().isoformat())

    if not food_log_text:
        recent_logs = await get_food_logs(db, user_id, days=1)
        if not recent_logs:
            raise HTTPException(status_code=400, detail='No food log provided or found for today')
        food_log_text = recent_logs[0].get('food_log_text', '')

    profile = await get_profile(db, user_id) or {}

    # Enrich with IFCT 2017 nutritional data for recognised foods
    food_names = _extract_food_names(food_log_text)
    ifct_results = lookup_batch(food_names)
    # Filter to only items where IFCT has a match (data is not None)
    ifct_context = [r for r in ifct_results if r.get('data') is not None]

    result = await analyze_diet(food_log_text, profile, ifct_context)
    return result
