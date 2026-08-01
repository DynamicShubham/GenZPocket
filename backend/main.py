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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers.expenses import router as expenses_router
from routers.budgets import router as budgets_router
from routers.goals import router as goals_router
from routers.recurring import router as recurring_router
from routers.ai import router as ai_router
from routers.reports import router as reports_router
from routers.notifications import router as notifications_router


app = FastAPI(
    title="GenZPocket API",
    description="Backend API for GenZPocket — Smart Expense Tracker for College Students",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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

# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": "GenZPocket API",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
