"""
Monthly Reports router.

Endpoints:
    GET  /reports              - List all monthly report summaries
    GET  /reports/{year}/{month} - Get specific month's report
    POST /reports/generate     - Generate (or regenerate) the current month's report
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from datetime import date
from decimal import Decimal
from typing import List

from database import get_db
from models import MonthlyReport, Expense, Budget
from schemas import MonthlyReportResponse
from auth.dependencies import get_current_user
from services.report_generator import generate_monthly_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=List[MonthlyReportResponse])
async def list_reports(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(MonthlyReport)
        .where(MonthlyReport.user_id == user_id)
        .order_by(MonthlyReport.month.desc())
    )
    return result.scalars().all()


@router.get("/{year}/{month}", response_model=MonthlyReportResponse)
async def get_report(
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    report_month = date(year, month, 1)
    result = await db.execute(
        select(MonthlyReport).where(
            MonthlyReport.user_id == user_id,
            MonthlyReport.month == report_month,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"No report found for {year}-{month:02d}. Try generating one.",
        )
    return report


@router.post("/generate", response_model=MonthlyReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Generate or refresh the current month's report and health score."""
    report = await generate_monthly_report(user_id, db)
    return report
