"""
Expenses router — full CRUD with auto-categorization.

Endpoints:
    POST   /expenses           - Create a new expense
    GET    /expenses           - List user's expenses (paginated, filterable)
    GET    /expenses/{id}      - Get single expense
    PUT    /expenses/{id}      - Update an expense
    DELETE /expenses/{id}      - Delete an expense
    POST   /expenses/categorize - Auto-categorize a merchant name (utility)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update, func, and_
from datetime import date
from typing import List, Optional
from decimal import Decimal

from database import get_db
from models import Expense, ExpenseCategory
from schemas import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from auth.dependencies import get_current_user
from services.categorization import auto_categorize
from services.storage import save_receipt_file
from services.ocr import process_receipt_ocr

router = APIRouter(prefix="/expenses", tags=["Expenses"])


# ─────────────────────────────────────────────────────────────────────────────
# RECEIPT UPLOAD & OCR
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/upload-receipt", response_model=dict)
async def upload_receipt(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """Upload a receipt image (R2 or local disk fallback) and return receipt_url."""
    url = await save_receipt_file(file)
    return {"receipt_url": url}


@router.post("/ocr", response_model=dict)
async def scan_receipt_ocr(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """Run OCR scanner on receipt image and return extracted structured data."""
    content = await file.read()
    receipt_url = await save_receipt_file(file)
    ocr_result = await process_receipt_ocr(content, filename=file.filename or "receipt.jpg")
    ocr_result["receipt_url"] = receipt_url
    return ocr_result



# ─────────────────────────────────────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────────────────────────────────────

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    payload: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Log a new expense. Auto-categorizes if category not provided."""
    expense_date = payload.date or date.today()

    # Auto-categorize if category not provided
    category = payload.category
    if category is None:
        category = auto_categorize(payload.merchant)

    new_expense = Expense(
        user_id=user_id,
        amount=payload.amount,
        category=category,
        merchant=payload.merchant,
        note=payload.note,
        date=expense_date,
        is_recurring=False,
    )

    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)

    # Check budget thresholds and create notifications
    from services.budget_alerts import check_budget_alerts
    await check_budget_alerts(user_id, db)

    # Update streak and award badges
    from services.gamification import update_streak_and_badges
    await update_streak_and_badges(user_id, db)

    return new_expense


# ─────────────────────────────────────────────────────────────────────────────
# LIST
# ─────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ExpenseResponse])
async def list_expenses(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
    # Pagination
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    # Filters
    category: Optional[ExpenseCategory] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    merchant: Optional[str] = Query(None),
):
    """List expenses with optional filters and pagination."""
    offset = (page - 1) * page_size

    conditions = [Expense.user_id == user_id]
    if category:
        conditions.append(Expense.category == category)
    if start_date:
        conditions.append(Expense.date >= start_date)
    if end_date:
        conditions.append(Expense.date <= end_date)
    if merchant:
        conditions.append(Expense.merchant.ilike(f"%{merchant}%"))

    stmt = (
        select(Expense)
        .where(and_(*conditions))
        .order_by(Expense.date.desc(), Expense.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )

    result = await db.execute(stmt)
    return result.scalars().all()


# ─────────────────────────────────────────────────────────────────────────────
# GET SINGLE
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")
    return expense


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)

    await db.commit()
    await db.refresh(expense)
    return expense


# ─────────────────────────────────────────────────────────────────────────────
# DELETE
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")

    await db.delete(expense)
    await db.commit()
