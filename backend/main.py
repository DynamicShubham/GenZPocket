import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend directory is in sys.path for clean imports
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load environment variables
load_dotenv(backend_dir / ".env")
if (backend_dir.parent / ".env.local").exists():
    load_dotenv(backend_dir.parent / ".env.local")

from contextlib import asynccontextmanager
import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

from routers.expenses import router as expenses_router
from routers.budgets import router as budgets_router
from routers.goals import router as goals_router
from routers.recurring import router as recurring_router
from routers.ai import router as ai_router
from routers.reports import router as reports_router
from routers.notifications import router as notifications_router
from routers.users import router as users_router
from routers.incomes import router as incomes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = aioredis.from_url(redis_url, encoding="utf8", decode_responses=True)
    try:
        FastAPICache.init(RedisBackend(redis_client), prefix="genzpocket-cache")
        print("Redis caching initialized successfully.")
    except Exception as e:
        print(f"Warning: Could not connect to Redis at {redis_url} ({e}). Caching will be inactive.")
    
    yield

    try:
        await redis_client.close()
    except Exception:
        pass


app = FastAPI(
    title="GenZPocket API",
    description="Backend API for GenZPocket — Smart Expense Tracker for College Students",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Mount static files for local uploads ──────────────────────────────────────
uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


# ── CORS ───────────────────────────────────────────────────────────────────────
cors_origins_env = os.getenv("CORS_ORIGINS", "")
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://genzpocket.vercel.app",
]
if cors_origins_env:
    origins.extend([origin.strip() for origin in cors_origins_env.split(",") if origin.strip()])

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ───────────────────────────────────────────────────────────
app.include_router(expenses_router)
app.include_router(budgets_router)
app.include_router(goals_router)
app.include_router(recurring_router)
app.include_router(ai_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(users_router)
app.include_router(incomes_router)

# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    redis_status = "unknown"
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        client = aioredis.from_url(redis_url)
        await client.ping()
        redis_status = "connected"
        await client.close()
    except Exception as e:
        redis_status = f"disconnected ({str(e)})"

    return {
        "status": "healthy",
        "app": "GenZPocket API",
        "version": "1.0.0",
        "redis": redis_status
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
