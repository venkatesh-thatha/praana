import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


db = Database()


async def connect_db(uri: str, db_name: str) -> None:
    db.client = AsyncIOMotorClient(uri)
    db.db = db.client[db_name]
    await db.client.admin.command('ping')
    logger.info('Connected to MongoDB: %s', db_name)


async def disconnect_db() -> None:
    if db.client:
        db.client.close()
        logger.info('Disconnected from MongoDB')


async def get_db() -> AsyncIOMotorDatabase:
    if db.db is None:
        raise RuntimeError('Database not initialised. Was connect_db() called at startup?')
    return db.db
