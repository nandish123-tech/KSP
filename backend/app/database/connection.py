import asyncpg
from contextlib import asynccontextmanager
from app.config.settings import settings

class DatabaseManager:
    def __init__(self):
        self.pool = None

    async def initialize_pool(self):
        if not self.pool:
            try:
                self.pool = await asyncpg.create_pool(
                    dsn=settings.DATABASE_URL,
                    min_size=2,            # Keeps hot connections open to minimize connection overhead
                    max_size=10,           # Scale boundary for parallel inquiries
                    command_timeout=15.0,  # Fails gracefully if AWS doesn't respond in 15 seconds
                    timeout=30.0           # Connection allocation timeout threshold
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