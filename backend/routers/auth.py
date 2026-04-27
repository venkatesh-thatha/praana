import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from ..db.connection import get_db
from ..db.queries import get_user_by_email, create_user
from ..auth.jwt_handler import hash_password, verify_password, create_access_token
from ..models.user import UserRegister, UserLogin

router = APIRouter()


@router.post('/register', status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister, db=Depends(get_db)):
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    user_id = str(uuid.uuid4())
    await create_user(db, {
        'user_id': user_id,
        'email': body.email,
        'password_hash': hash_password(body.password),
        'name': body.name,
    })
    token = create_access_token({'sub': user_id})
    return {'access_token': token, 'token_type': 'bearer', 'user_id': user_id}


@router.post('/login')
async def login(body: UserLogin, db=Depends(get_db)):
    user = await get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    token = create_access_token({'sub': user['user_id']})
    return {'access_token': token, 'token_type': 'bearer', 'user_id': user['user_id']}
