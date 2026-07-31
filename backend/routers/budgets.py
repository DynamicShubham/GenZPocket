"""
Budgets router.

Endpoints:
    POST /budgets            - Create or replace the monthly budget
    GET  /budgets            - Get the current month's budget
    GET  /budgets/status     - Real-time spending vs. limits
    PUT  /budgets/{id}       - Update limits
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from datetime import date
from decimal import Decimal
from typing import List, Optional

from database import get_db
from models import Budget, Expense
from schemas import (
    BudgetCreate,
    BudgetResponse,
    BudgetStatusResponse,
    OverallBudgetStatus,
    CategoryBudgetStatus,
)
from auth.dependencies import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])


# ─────────────────────────────────────────────────────────────────────────────
# CREATE / UPSERT
# ─────────────────────────────────────────────────────────────────────────────

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    payload: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create a budget for a given month. If one already exists for that month, it is replaced."""
    month_start = payload.month.replace(day=1)

    # Check for existing budget this month
    result = await db.execute(
        select(Budget).where(Budget.user_id == user_id, Budget.month == month_start)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.overall_limit = payload.overall_limit
        existing.category_limits = payload.category_limits
        await db.commit()
        await db.refresh(existing)
        return existing

    budget = Budget(
        user_id=user_id,
        month=month_start,
        overall_limit=payload.overall_limit,
        category_limits=payload.category_limits,
    )
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    return budget


# ─────────────────────────────────────────────────────────────────────────────
# LIST (current month)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[BudgetResponse])
async def list_budgets(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Return all budget records for the user, newest first."""
    result = await db.execute(
        select(Budget)
        .where(Budget.user_id == user_id)
        .order_by(Budget.month.desc())
    )
    return result.scalars().all()


# ─────────────────────────────────────────────────────────────────────────────
# BUDGET STATUS — real-time spending vs. limits
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/status", response_model=BudgetStatusResponse)
async def budget_status(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Real-time remaining budget for the current month."""
    today = date.today()
    month_start = today.replace(day=1)

    result = await db.execute(
        select(Budget).where(Budget.user_id == user_id, Budget.month == month_start)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=404,
            detail="No budget set for the current month. Create one first.",
        )

    # Sum spending per category this month
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
    overall_limit = Decimal(str(budget.overall_limit))

    # Build category breakdown
    category_breakdown: list[CategoryBudgetStatus] = []
    cat_limits: dict = budget.category_limits or {}
    for cat_name, limit_val in cat_limits.items():
        limit = Decimal(str(limit_val))
        spent = category_totals.get(cat_name, Decimal("0"))
        remaining = max(limit - spent, Decimal("0"))
        pct = float((spent / limit * 100)) if limit > 0 else 0.0
        category_breakdown.append(
            CategoryBudgetStatus(
                name=cat_name,
                limit=limit,
                spent=spent,
                remaining=remaining,
                pct=round(pct, 1),
            )
        )

    overall_remaining = max(overall_limit - overall_spent, Decimal("0"))
    return BudgetStatusResponse(
        overall=OverallBudgetStatus(
            limit=overall_limit,
            spent=overall_spent,
            remaining=overall_remaining,
            pct=round(float(overall_spent / overall_limit * 100) if overall_limit > 0 else 0.0, 1),
        ),
        categories=category_breakdown,
    )


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    payload: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found.")

    budget.overall_limit = payload.overall_limit
    budget.category_limits = payload.category_limits
    await db.commit()
    await db.refresh(budget)
    return budget
