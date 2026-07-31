import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

# Load environment variables reliably from backend/.env or root .env.local
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / ".env")
load_dotenv(backend_dir.parent / ".env.local")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback to local SQLite DB for development if DATABASE_URL is not set
    DATABASE_URL = f"sqlite+aiosqlite:///{backend_dir}/genzpocket.db"
else:
    # Ensure correct asyncpg driver protocol for PostgreSQL
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args,
)

# Create async session maker
async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Declarative Base for models
Base = declarative_base()

# Dependency to get db session in FastAPI router handlers
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
