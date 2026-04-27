import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from ..db.connection import get_db
from ..db.queries import get_profile, save_scan
from ..auth.jwt_handler import get_current_user
from ..services.claude_service import analyze_label
from ..services.openfda_service import check_drug_interactions

router = APIRouter()


@router.post('/analyze')
async def analyze(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    image_base64 = body.get('image_base64', '')
    scan_mode = body.get('scan_mode', 'food')

    if not image_base64:
        raise HTTPException(status_code=400, detail='image_base64 is required')
    if scan_mode not in ('food', 'medicine'):
        raise HTTPException(status_code=400, detail='scan_mode must be food or medicine')

    profile = await get_profile(db, user_id) or {}
    result = await analyze_label(image_base64, scan_mode, profile)

    if scan_mode == 'medicine':
        medications = profile.get('medical_history', {}).get('medications', [])
        apis = [
            i['ingredient_name'] for i in result.get('ingredients', [])
            if i.get('category') == 'active_pharma'
        ]
        if apis and medications:
            interactions = await check_drug_interactions(apis, medications)
            result['drug_interactions'] = interactions

    scan_record = {
        'scan_id': str(uuid.uuid4()),
        'user_id': user_id,
        'timestamp': datetime.now(timezone.utc),
        'scan_mode': scan_mode,
        **result,
    }
    await save_scan(db, scan_record)
    scan_record.pop('user_id', None)
    return scan_record
