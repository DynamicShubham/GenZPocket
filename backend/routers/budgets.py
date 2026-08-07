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
from sqlalchemy import select, text, func
from datetime import date
from decimal import Decimal
from typing import List, Optional

from database import get_db
from models import Budget, Expense, Income
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
        existing.overall_limit = payload.overall_limit  # type: ignore
        existing.category_limits = payload.category_limits  # type: ignore
        existing.is_auto_income = False  # type: ignore
        await db.commit()
        await db.refresh(existing)
        return existing

    budget = Budget(
        user_id=user_id,
        month=month_start,
        overall_limit=payload.overall_limit,
        category_limits=payload.category_limits,
        is_auto_income=False
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
    
    # Calculate total income for this month
    income_rows = await db.execute(
        select(func.sum(Income.amount))
        .where(Income.user_id == user_id, Income.month == month_start)
    )
    total_income = Decimal(str(income_rows.scalar_one_or_none() or 0.00))

    if not budget:
        overall_limit = Decimal("0.00")
        is_auto_income = False
        cat_limits = {}
    else:
        is_auto_income = False
        overall_limit = Decimal(str(budget.overall_limit))
        cat_limits = budget.category_limits or {}

    # Sum spending per category this month
    rows = await db.execute(
        select(Expense.category, func.sum(Expense.amount).label("total"))
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

    # Build category breakdown
    category_breakdown: list[CategoryBudgetStatus] = []
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
        total_income=total_income,
        is_auto_income=is_auto_income,
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

    budget.overall_limit = payload.overall_limit  # type: ignore
    budget.category_limits = payload.category_limits  # type: ignore
    budget.is_auto_income = False  # type: ignore
    await db.commit()
    await db.refresh(budget)
    return budget
