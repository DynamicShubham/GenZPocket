from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import date
from decimal import Decimal
from typing import List, Optional

from database import get_db
from models import Income
from schemas import IncomeCreate, IncomeResponse
from auth.dependencies import get_current_user

router = APIRouter(prefix="/incomes", tags=["Incomes"])

@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
async def create_income(
    payload: IncomeCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Log a new income."""
    income_date = payload.date or date.today()
    month_start = income_date.replace(day=1)
    
    income = Income(
        user_id=user_id,
        amount=payload.amount,
        source=payload.source,
        date=income_date,
        month=month_start,
        is_recurring=False
    )
    db.add(income)
    await db.commit()
    await db.refresh(income)
    return income

@router.get("", response_model=List[IncomeResponse])
async def list_incomes(
    month: Optional[date] = Query(None, description="Filter by exact month (YYYY-MM-01)"),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List incomes. Optionally filter by month."""
    stmt = select(Income).where(Income.user_id == user_id).order_by(desc(Income.date), desc(Income.created_at))
    
    if month:
        stmt = stmt.where(Income.month == month)
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income(
    income_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Delete an income record."""
    result = await db.execute(select(Income).where(Income.id == income_id, Income.user_id == user_id))
    income = result.scalar_one_or_none()
    
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
        
    await db.delete(income)
    await db.commit()
    return
