from fastapi import APIRouter, Depends, HTTPException
from ..db.connection import get_db
from ..db.queries import get_profile
from ..auth.jwt_handler import get_current_user
from ..services.claude_service import analyze_lab_report

router = APIRouter()


@router.post('/analyze')
async def analyze(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user['user_id']
    image_base64 = body.get('image_base64', '')
    media_type = body.get('media_type', 'image/jpeg')

    if not image_base64:
        raise HTTPException(status_code=400, detail='image_base64 is required')

    allowed_types = ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
    if media_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f'media_type must be one of: {", ".join(allowed_types)}',
        )

    profile = await get_profile(db, user_id) or {}

    try:
        result = await analyze_lab_report(image_base64, media_type, profile)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Lab report analysis failed: {str(e)}')

    return result
