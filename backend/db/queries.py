from datetime import datetime, timedelta, timezone


async def get_user_by_email(db, email: str) -> dict | None:
    return await db['users'].find_one({'email': email}, {'_id': 0})


async def get_user_by_id(db, user_id: str) -> dict | None:
    return await db['users'].find_one({'user_id': user_id}, {'_id': 0})


async def create_user(db, user_data: dict) -> str:
    await db['users'].insert_one(user_data)
    return user_data['user_id']


async def upsert_profile(db, user_id: str, profile_data: dict) -> bool:
    profile_data['user_id'] = user_id
    profile_data['updated_at'] = datetime.now(timezone.utc)
    result = await db['profiles'].replace_one({'user_id': user_id}, profile_data, upsert=True)
    return result.upserted_id is not None


async def get_profile(db, user_id: str) -> dict | None:
    return await db['profiles'].find_one({'user_id': user_id}, {'_id': 0})


async def save_session(db, session: dict) -> str:
    await db['sessions'].insert_one(session)
    return session['session_id']


async def get_sessions(db, user_id: str, limit: int = 10) -> list[dict]:
    cursor = db['sessions'].find({'user_id': user_id}, {'_id': 0}).sort('created_at', -1).limit(limit)
    return await cursor.to_list(length=limit)


async def log_vitals(db, vitals: dict) -> str:
    await db['vitals'].insert_one(vitals)
    return vitals['vitals_id']


async def get_vitals_history(db, user_id: str, days: int = 30) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cursor = (
        db['vitals']
        .find({'user_id': user_id, 'timestamp': {'$gte': cutoff}}, {'_id': 0})
        .sort('timestamp', 1)
    )
    return await cursor.to_list(length=None)


async def log_food(db, food_log: dict) -> str:
    await db['food_logs'].insert_one(food_log)
    return food_log['log_id']


async def get_food_logs(db, user_id: str, days: int = 7) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cursor = (
        db['food_logs']
        .find({'user_id': user_id, 'created_at': {'$gte': cutoff}}, {'_id': 0})
        .sort('date', -1)
    )
    return await cursor.to_list(length=None)


async def save_scan(db, scan: dict) -> str:
    await db['scans'].insert_one(scan)
    return scan['scan_id']


async def save_brief(db, brief: dict) -> str:
    await db['briefs'].insert_one(brief)
    return brief['brief_id']


async def get_brief(db, brief_id: str) -> dict | None:
    return await db['briefs'].find_one({'brief_id': brief_id}, {'_id': 0})
