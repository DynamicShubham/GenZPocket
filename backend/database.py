import os
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback/placeholder for development if not set yet
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/genzpocket"
else:
    from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
    parsed = urlparse(DATABASE_URL)
    q_params = parse_qsl(parsed.query)
    filtered_params = []
    for k, v in q_params:
        if k == "channel_binding":
            continue
        if k == "sslmode":
            filtered_params.append(("ssl", v))
        else:
            filtered_params.append((k, v))
    new_query = urlencode(filtered_params)
    parsed = parsed._replace(query=new_query)
    DATABASE_URL = urlunparse(parsed)

    # Ensure correct asyncpg driver protocol
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
    pool_size=10,
    max_overflow=5,
    pool_recycle=300,
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
