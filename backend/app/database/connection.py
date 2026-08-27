import asyncpg
import asyncio
from contextlib import asynccontextmanager
from app.config.settings import settings

class DatabaseManager:
    def __init__(self):
        self.pool = None
        self._lock = asyncio.Lock()

    async def initialize_pool(self):
        async with self._lock:
            if not self.pool:
                try:
                    self.pool = await asyncpg.create_pool(
                        dsn=settings.DATABASE_URL,
                        min_size=2,            
                        max_size=20,           
                        command_timeout=60.0,  
                        timeout=60.0           
                    )
                    print("AWS RDS Connection Pool established successfully.")
                except Exception as e:
                    print(f"Failed to connect to AWS RDS: {str(e)}")
                    raise e

    async def close_pool(self):
        if self.pool:
            await self.pool.close()

db_manager = DatabaseManager()

@asynccontextmanager
async def get_db_connection():
    if not db_manager.pool:
        await db_manager.initialize_pool()
    
    async with db_manager.pool.acquire() as connection:
        yield connection