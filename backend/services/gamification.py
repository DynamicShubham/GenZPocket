"""
Streaks & Badges service.

Called after every successful expense log to:
1. Update the user's daily streak counter.
2. Check for and award milestone badges.
"""

from datetime import date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models import User, UserBadge, Expense

# ── Badge Definitions ─────────────────────────────────────────────────────────
BADGES = {
    "first_log":      {"id": "first_log",      "name": "First Step 👣",     "desc": "Logged your first expense"},
    "streak_7":       {"id": "streak_7",        "name": "Week Warrior 🔥",   "desc": "7-day logging streak"},
    "streak_30":      {"id": "streak_30",       "name": "Month Master 🏆",   "desc": "30-day logging streak"},
    "budget_setter":  {"id": "budget_setter",   "name": "Budget Boss 💼",    "desc": "Set your first monthly budget"},
    "goal_creator":   {"id": "goal_creator",    "name": "Goal Getter 🎯",    "desc": "Created your first savings goal"},
    "century_logs":   {"id": "century_logs",    "name": "Century Club 💯",   "desc": "Logged 100 expenses"},
}


async def _has_badge(user_id: str, badge_id: str, db: AsyncSession) -> bool:
    result = await db.execute(
        select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def _award_badge(user_id: str, badge_id: str, db: AsyncSession) -> None:
    if not await _has_badge(user_id, badge_id, db):
        db.add(UserBadge(user_id=user_id, badge_id=badge_id))
        await db.commit()


async def update_streak_and_badges(user_id: str, db: AsyncSession) -> None:
    """Update streak on expense log and award any newly earned badges."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return

    today = date.today()

    # ── Update streak ─────────────────────────────────────────────────────────
    if user.last_logged_date is None:
        user.streak = 1
    elif user.last_logged_date == today:
        pass  # Already logged today, no change
    elif user.last_logged_date == today - timedelta(days=1):
        user.streak += 1  # Consecutive day
    else:
        user.streak = 1  # Streak broken, reset

    user.last_logged_date = today
    await db.commit()

    # ── Check badges ──────────────────────────────────────────────────────────
    expense_count_result = await db.execute(
        select(func.count()).select_from(Expense).where(Expense.user_id == user_id)
    )
    expense_count = expense_count_result.scalar() or 0

    if expense_count >= 1:
        await _award_badge(user_id, "first_log", db)
    if expense_count >= 100:
        await _award_badge(user_id, "century_logs", db)
    if user.streak >= 7:
        await _award_badge(user_id, "streak_7", db)
    if user.streak >= 30:
        await _award_badge(user_id, "streak_30", db)
