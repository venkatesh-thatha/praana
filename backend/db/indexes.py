import logging
from pymongo import ASCENDING, DESCENDING

logger = logging.getLogger(__name__)


async def create_indexes(database) -> None:
    await database['users'].create_index([('email', ASCENDING)], unique=True, name='users_email_unique')
    await database['users'].create_index([('user_id', ASCENDING)], unique=True, name='users_user_id_unique')
    await database['profiles'].create_index([('user_id', ASCENDING)], unique=True, name='profiles_user_id_unique')
    await database['sessions'].create_index(
        [('user_id', ASCENDING), ('created_at', DESCENDING)], name='sessions_user_created'
    )
    await database['sessions'].create_index([('session_id', ASCENDING)], unique=True, name='sessions_session_id_unique')
    await database['vitals'].create_index(
        [('user_id', ASCENDING), ('timestamp', DESCENDING)], name='vitals_user_timestamp'
    )
    await database['food_logs'].create_index(
        [('user_id', ASCENDING), ('date', DESCENDING)], name='food_logs_user_date'
    )
    await database['briefs'].create_index(
        [('user_id', ASCENDING), ('session_id', ASCENDING)], unique=True, name='briefs_user_session_unique'
    )
    await database['briefs'].create_index([('brief_id', ASCENDING)], unique=True, name='briefs_brief_id_unique')
    await database['scans'].create_index(
        [('user_id', ASCENDING), ('timestamp', DESCENDING)], name='scans_user_timestamp'
    )
    logger.info('MongoDB indexes created successfully')
