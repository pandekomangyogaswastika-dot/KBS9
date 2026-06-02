import os
from motor.motor_asyncio import AsyncIOMotorClient

_client = None


def get_client():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    return _client


def get_db():
    return get_client()[os.environ["DB_NAME"]]
