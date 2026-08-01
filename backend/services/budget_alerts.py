"""
Budget alert service.

Checks current spending vs. budget limits after every new expense and creates
Notification records at 50%, 80%, and 100% thresholds (fires only once per
threshold per budget month).
"""

from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_
from models import Budget, Expense, Notification, NotificationType, ExpenseCategory


async def check_budget_alerts(user_id: str, db: AsyncSession) -> None:
    """
    Called after each expense creation. Creates notifications if budget
    thresholds are crossed — but only once per threshold (idempotent).
    """
    today = date.today()
    month_start = today.replace(day=1)

    # ── 1. Load current budget ────────────────────────────────────────────────
    budget_result = await db.execute(
        select(Budget).where(
            Budget.user_id == user_id,
            Budget.month == month_start,
        )
    )
    budget = budget_result.scalar_one_or_none()
    if not budget:
        return  # No budget set, nothing to check

    # ── 2. Sum all expenses this month ────────────────────────────────────────
    rows = await db.execute(
        select(Expense.category, text("SUM(amount) as total"))
        .where(
            Expense.user_id == user_id,
            Expense.date >= month_start,
            Expense.date <= today,
        )
        .group_by(Expense.category)
    )
    category_totals: dict[str, Decimal] = {
        row.category: Decimal(str(row.total)) for row in rows.fetchall()
    }
    overall_spent = sum(category_totals.values(), Decimal("0"))

    # ── 3. Helper: notify once per threshold ──────────────────────────────────
    # Build a datetime representing start of this month for the created_at comparison
    from datetime import timezone
    month_start_dt = datetime(month_start.year, month_start.month, 1, tzinfo=timezone.utc)

    async def _maybe_notify(
        notif_type: NotificationType,
        message: str,
    ) -> None:
        # Check if this notification type already exists this month
        existing = await db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.type == notif_type,
                # Compare against a datetime object — works for both SQLite and PostgreSQL
                Notification.created_at >= month_start_dt,
            )
        )
        if existing.scalar_one_or_none():
            return  # Already sent for this month
        db.add(
            Notification(
                user_id=user_id,
                type=notif_type,
                message=message,
            )
        )
        await db.commit()

    # ── 4. Check overall budget thresholds ────────────────────────────────────
    overall_limit = Decimal(str(budget.overall_limit))
    if overall_limit > 0:
        pct = (overall_spent / overall_limit) * 100
        if pct >= 100:
            await _maybe_notify(
                NotificationType.BUDGET_100,
                f"🚨 You've used 100% of your ₹{int(overall_limit)} monthly budget!",
            )
        elif pct >= 80:
            await _maybe_notify(
                NotificationType.BUDGET_80,
                f"⚠️ You've used 80% of your monthly budget. ₹{int(overall_limit - overall_spent)} left.",
            )
        elif pct >= 50:
            await _maybe_notify(
                NotificationType.BUDGET_50,
                f"📊 Heads up — you've used 50% of your monthly budget.",
            )
