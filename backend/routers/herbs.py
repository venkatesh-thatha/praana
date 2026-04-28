from fastapi import APIRouter, Depends, HTTPException
from ..db.connection import get_db
from ..db.queries import get_profile
from ..auth.jwt_handler import get_current_user
from ..services.claude_service import generate_remedies

router = APIRouter()

# Static herbs knowledge base — 12 common Indian household herbs/spices
HERBS_LIBRARY = [
    {
        'id': 'turmeric',
        'name': 'Turmeric',
        'hindi': 'Haldi',
        'emoji': '🟡',
        'tagline': 'Anti-inflammatory powerhouse',
        'benefits': ['Reduces inflammation', 'Antioxidant', 'Joint support', 'Gut health'],
        'conditions': ['arthritis', 'diabetes', 'skin'],
    },
    {
        'id': 'ginger',
        'name': 'Ginger',
        'hindi': 'Adrak',
        'emoji': '🫚',
        'tagline': 'Digestive & immunity booster',
        'benefits': ['Relieves nausea', 'Anti-inflammatory', 'Improves circulation', 'Cold & flu relief'],
        'conditions': ['nausea', 'cold', 'arthritis'],
    },
    {
        'id': 'tulsi',
        'name': 'Holy Basil',
        'hindi': 'Tulsi',
        'emoji': '🌿',
        'tagline': 'Queen of herbs in Ayurveda',
        'benefits': ['Reduces stress', 'Immunity', 'Respiratory health', 'Blood sugar support'],
        'conditions': ['stress', 'diabetes', 'respiratory'],
    },
    {
        'id': 'neem',
        'name': 'Neem',
        'hindi': 'Neem',
        'emoji': '🍃',
        'tagline': "Nature's antibiotic",
        'benefits': ['Antibacterial', 'Blood purifier', 'Skin health', 'Dental health'],
        'conditions': ['skin', 'diabetes', 'infection'],
    },
    {
        'id': 'amla',
        'name': 'Indian Gooseberry',
        'hindi': 'Amla',
        'emoji': '🫐',
        'tagline': 'Highest natural Vitamin C',
        'benefits': ['Immunity boost', 'Hair health', 'Digestion', 'Cholesterol management'],
        'conditions': ['immunity', 'hair loss', 'cholesterol'],
    },
    {
        'id': 'ashwagandha',
        'name': 'Ashwagandha',
        'hindi': 'Ashwagandha',
        'emoji': '🌱',
        'tagline': 'Adaptogen for stress & strength',
        'benefits': ['Reduces cortisol', 'Energy', 'Thyroid support', 'Muscle recovery'],
        'conditions': ['stress', 'fatigue', 'thyroid'],
    },
    {
        'id': 'cloves',
        'name': 'Cloves',
        'hindi': 'Laung',
        'emoji': '🟤',
        'tagline': 'Pain relief & antiseptic',
        'benefits': ['Toothache relief', 'Antibacterial', 'Digestive', 'Blood sugar'],
        'conditions': ['toothache', 'diabetes', 'infection'],
    },
    {
        'id': 'fenugreek',
        'name': 'Fenugreek',
        'hindi': 'Methi',
        'emoji': '🌾',
        'tagline': 'Diabetes & hormone balancer',
        'benefits': ['Blood sugar control', 'Milk production', 'Cholesterol', 'Testosterone support'],
        'conditions': ['diabetes', 'cholesterol', 'pcos'],
    },
    {
        'id': 'ajwain',
        'name': 'Carom Seeds',
        'hindi': 'Ajwain',
        'emoji': '⚪',
        'tagline': 'Instant digestive relief',
        'benefits': ['Bloating relief', 'Acidity', 'Respiratory', 'Anti-spasmodic'],
        'conditions': ['bloating', 'acidity', 'asthma'],
    },
    {
        'id': 'cardamom',
        'name': 'Cardamom',
        'hindi': 'Elaichi',
        'emoji': '💚',
        'tagline': 'Heart & breath freshener',
        'benefits': ['Heart health', 'Antioxidant', 'Breath freshener', 'Blood pressure'],
        'conditions': ['hypertension', 'digestion'],
    },
    {
        'id': 'cinnamon',
        'name': 'Cinnamon',
        'hindi': 'Dalchini',
        'emoji': '🟫',
        'tagline': 'Blood sugar regulator',
        'benefits': ['Blood sugar control', 'Anti-inflammatory', 'Cholesterol', 'Antifungal'],
        'conditions': ['diabetes', 'cholesterol', 'pcos'],
    },
    {
        'id': 'triphala',
        'name': 'Triphala',
        'hindi': 'Triphala',
        'emoji': '🫙',
        'tagline': 'Ayurvedic digestive tonic',
        'benefits': ['Bowel regularity', 'Eye health', 'Detox', 'Immunity'],
        'conditions': ['constipation', 'immunity', 'digestion'],
    },
]


@router.get('/library')
async def get_library():
    """Return the static herbs knowledge base (no auth required)."""
    return {'herbs': HERBS_LIBRARY}


@router.get('/remedies')
async def get_remedies(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Generate AI-personalized Indian home remedies cross-referenced with the user's health profile."""
    user_id = current_user['user_id']
    profile = await get_profile(db, user_id) or {}
    try:
        result = await generate_remedies(profile)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Remedy generation failed: {str(e)}')
    return result
