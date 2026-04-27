import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from ..db.connection import get_db
from ..db.queries import get_profile, log_vitals, get_vitals_history
from ..auth.jwt_handler import get_current_user
from ..services.claude_service import analyze_vitals
from ..utils.vitals_stats import (
    calculate_baseline,
    calculate_rolling_average,
    detect_anomaly,
    detect_constellations,
)

router = APIRouter()

METRICS = ['hr_bpm', 'bp_systolic', 'bp_diastolic', 'spo2', 'temperature', 'weight_kg']


@router.post('/log')
async def log_vitals_entry(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    entry_data = {k: body.get(k) for k in METRICS if body.get(k) is not None}
    if not entry_data:
        raise HTTPException(status_code=400, detail='At least one vital metric is required')
    vitals_id = str(uuid.uuid4())
    await log_vitals(db, {
        'vitals_id': vitals_id,
        'user_id': user_id,
        'timestamp': datetime.now(timezone.utc),
        **entry_data,
    })
    return {'vitals_id': vitals_id, 'message': 'Vitals logged'}


@router.get('/history')
async def get_history(
    days: int = 7,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Return raw vitals time-series for sparkline rendering in the frontend."""
    user_id = current_user['user_id']
    history = await get_vitals_history(db, user_id, days=days)
    # Serialize datetime objects to ISO strings
    serialized = []
    for entry in history:
        row: dict = {}
        for k, v in entry.items():
            if hasattr(v, 'isoformat'):
                row[k] = v.isoformat()
            else:
                row[k] = v
        serialized.append(row)
    return {'history': serialized}


@router.get('/analysis')
async def get_analysis(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    profile = await get_profile(db, user_id) or {}
    history = await get_vitals_history(db, user_id, days=30)

    if not history:
        return {'message': 'No vitals data yet', 'trends': [], 'alerts': [], 'constellation_patterns': []}

    trends = []
    for metric in METRICS:
        baseline = calculate_baseline(history, metric)
        avg_7d = calculate_rolling_average(history, metric, days=7)
        avg_30d = calculate_rolling_average(history, metric, days=30)
        if avg_7d is None:
            continue
        anomaly = detect_anomaly(avg_7d, baseline) if baseline else False
        # Determine trend direction
        avg_prev_7d = calculate_rolling_average(history[len(history)//2:], metric, days=7)
        if avg_prev_7d and avg_7d:
            direction = 'rising' if avg_7d > avg_prev_7d * 1.05 else 'falling' if avg_7d < avg_prev_7d * 0.95 else 'stable'
        else:
            direction = 'stable'
        trends.append({
            'metric': metric,
            'average_7d': avg_7d,
            'average_30d': avg_30d,
            'baseline': baseline,
            'trend_direction': direction,
            'anomaly': anomaly,
        })

    constellations = detect_constellations(trends)
    ai_analysis = await analyze_vitals({'trends': trends, 'constellations': constellations}, profile)

    return {
        'trends': trends,
        'constellation_patterns': constellations,
        'ai_analysis': ai_analysis,
    }
