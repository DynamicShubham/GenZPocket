"""
Report generation service.

Calculates the monthly financial health score and builds the report_data payload.

Health Score Algorithm (0–100):
  - Budget adherence:      40 pts  (spent ≤ limit = full pts, scaled down otherwise)
  - Savings rate:          30 pts  (saved ≥ 20% of budget = full pts)
  - Consistency:           20 pts  (logged expenses on ≥ 15 distinct days = full pts)
  - No overspend in any category: 10 pts bonus
"""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import cast, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func

from models import MonthlyReport, Expense, Budget


async def generate_monthly_report(user_id: str, db: AsyncSession) -> MonthlyReport:
    today = date.today()
    month_start = today.replace(day=1)

    # ── Expenses this month ───────────────────────────────────────────────────
    rows = await db.execute(
        select(Expense.category, func.sum(Expense.amount).label("total"))
        .where(
            Expense.user_id == user_id,
            Expense.date >= month_start,
            Expense.date <= today,
        )
        .group_by(Expense.category)
    )
    category_totals: dict[str, float] = {r[0]: float(r[1] or 0) for r in rows.fetchall()}
    total_expenses = sum(category_totals.values())

    # ── Distinct logging days (consistency) ───────────────────────────────────
    days_result = await db.execute(
        select(func.count(func.distinct(Expense.date)))
        .where(
            Expense.user_id == user_id,
            Expense.date >= month_start,
            Expense.date <= today,
        )
    )
    distinct_days: int = days_result.scalar() or 0

    # ── Budget ────────────────────────────────────────────────────────────────
    budget_result = await db.execute(
        select(Budget).where(Budget.user_id == user_id, Budget.month == month_start)
    )
    budget = budget_result.scalar_one_or_none()
    overall_limit = float(cast(Decimal, budget.overall_limit)) if budget else 0.0
    cat_limits: dict = cast(dict, budget.category_limits) if (budget and budget.category_limits) else {}

    # ── Health Score Calculation ──────────────────────────────────────────────
    score = 0

    # 1. Budget adherence (40 pts)
    if overall_limit > 0:
        adherence_ratio = min(total_expenses / overall_limit, 1.0)
        score += int((1 - adherence_ratio) * 40)
    else:
        score += 20  # no budget = partial credit

    # 2. Savings approximation (30 pts) — savings = budget - expenses
    if overall_limit > 0:
        savings_rate = max((overall_limit - total_expenses) / overall_limit, 0)
        score += int(min(savings_rate / 0.20, 1.0) * 30)

    # 3. Consistency (20 pts)
    score += int(min(distinct_days / 15, 1.0) * 20)

    # 4. No category overspend bonus (10 pts)
    overspent = False
    for cat, limit_val in cat_limits.items():
        if category_totals.get(cat, 0) > float(limit_val):
            overspent = True
            break
    if not overspent:
        score += 10

    health_score = min(score, 100)
    savings = max(overall_limit - total_expenses, 0)

    report_data = {
        "category_breakdown": category_totals,
        "distinct_logging_days": distinct_days,
        "overall_limit": overall_limit,
        "generated_at": datetime.now().isoformat(),
    }

    # ── Upsert report ─────────────────────────────────────────────────────────
    existing_result = await db.execute(
        select(MonthlyReport).where(
            MonthlyReport.user_id == user_id,
            MonthlyReport.month == month_start,
        )
    )
    report = existing_result.scalar_one_or_none()

    if report:
        report.total_expenses = cast(Any, Decimal(str(total_expenses)))
        report.savings = cast(Any, Decimal(str(savings)))
        report.health_score = cast(Any, health_score)
        report.report_data = cast(Any, report_data)
    else:
        report = MonthlyReport(
            user_id=user_id,
            month=month_start,
            total_income=Decimal("0.00"),
            total_expenses=Decimal(str(total_expenses)),
            savings=Decimal(str(savings)),
            health_score=health_score,
            report_data=report_data,
        )
        db.add(report)

    await db.commit()
    await db.refresh(report)
    return report
