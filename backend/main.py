import os
# pyrefly: ignore [missing-import]
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

# ── Register routers ───────────────────────────────────────────────────────────
app.include_router(expenses_router)
app.include_router(budgets_router)
app.include_router(goals_router)
app.include_router(recurring_router)
app.include_router(ai_router)
app.include_router(reports_router)
app.include_router(notifications_router)

# ── CORS ───────────────────────────────────────────────────────────────────────
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
