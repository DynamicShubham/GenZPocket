"""
Recurring Expenses router.

Endpoints:
    POST   /recurring           - Create a recurring expense template
    GET    /recurring           - List recurring expense templates
    PUT    /recurring/{id}      - Update a template
    DELETE /recurring/{id}      - Cancel/delete a template
    POST   /recurring/{id}/apply - Manually apply (log) a due recurring expense
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import List
from decimal import Decimal

from database import get_db
from models import RecurringExpense, Expense, RecurringFrequency
from schemas import RecurringExpenseCreate, RecurringExpenseResponse
from auth.dependencies import get_current_user

router = APIRouter(prefix="/recurring", tags=["Recurring Expenses"])


def _next_due(current: date, frequency: RecurringFrequency) -> date:
    """Advance the due date by one frequency period."""
    from dateutil.relativedelta import relativedelta
    if frequency == RecurringFrequency.DAILY:
        from datetime import timedelta
        return current + timedelta(days=1)
    elif frequency == RecurringFrequency.WEEKLY:
        from datetime import timedelta
        return current + timedelta(weeks=1)
    elif frequency == RecurringFrequency.MONTHLY:
        return current + relativedelta(months=1)
    return current


@router.post("", response_model=RecurringExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring(
    payload: RecurringExpenseCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    rec = RecurringExpense(
        user_id=user_id,
        amount=payload.amount,
        category=payload.category,
        merchant=payload.merchant,
        note=payload.note,
        frequency=payload.frequency,
        next_due_date=payload.next_due_date,
        is_active=True,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return rec


@router.get("", response_model=List[RecurringExpenseResponse])
async def list_recurring(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(RecurringExpense)
        .where(RecurringExpense.user_id == user_id, RecurringExpense.is_active == True)
        .order_by(RecurringExpense.next_due_date.asc())
    )
    return result.scalars().all()


@router.put("/{rec_id}", response_model=RecurringExpenseResponse)
async def update_recurring(
    rec_id: str,
    payload: RecurringExpenseCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(RecurringExpense).where(
            RecurringExpense.id == rec_id,
            RecurringExpense.user_id == user_id,
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring expense not found.")

    rec.amount = payload.amount
    rec.category = payload.category
    rec.merchant = payload.merchant
    rec.note = payload.note
    rec.frequency = payload.frequency
    rec.next_due_date = payload.next_due_date
    await db.commit()
    await db.refresh(rec)
    return rec


@router.delete("/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_recurring(
    rec_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(RecurringExpense).where(
            RecurringExpense.id == rec_id,
            RecurringExpense.user_id == user_id,
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring expense not found.")

    rec.is_active = False
    await db.commit()


@router.post("/{rec_id}/apply", response_model=dict)
async def apply_recurring(
    rec_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Manually log a recurring expense and advance its next_due_date."""
    result = await db.execute(
        select(RecurringExpense).where(
            RecurringExpense.id == rec_id,
            RecurringExpense.user_id == user_id,
            RecurringExpense.is_active == True,
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring expense not found or inactive.")

    # Log the expense
    expense = Expense(
        user_id=user_id,
        amount=rec.amount,
        category=rec.category,
        merchant=rec.merchant,
        note=rec.note,
        date=date.today(),
        is_recurring=True,
    )
    db.add(expense)

    # Advance next_due_date
    rec.next_due_date = _next_due(rec.next_due_date, rec.frequency)
    await db.commit()

    return {"message": "Recurring expense applied successfully.", "next_due_date": rec.next_due_date.isoformat()}
