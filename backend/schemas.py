from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal
from models import ExpenseCategory, RecurringFrequency, NotificationType

# ──────────────────────────────────────────────────────────────────────
# EXPENSE SCHEMAS
# ──────────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0"), description="Expense amount (positive number)")
    category: Optional[ExpenseCategory] = None  # If omitted, auto-categorized from merchant
    merchant: str = Field(..., min_length=1, max_length=255)
    note: Optional[str] = Field(None, max_length=1024)
    date: Optional[date] = None

    class Config:
        from_attributes = True


class ExpenseUpdate(BaseModel):
    """Partial update schema — all fields are optional."""
    amount: Optional[Decimal] = Field(None, gt=Decimal("0"))
    category: Optional[ExpenseCategory] = None
    merchant: Optional[str] = Field(None, min_length=1, max_length=255)
    note: Optional[str] = Field(None, max_length=1024)
    date: Optional[date] = None

    class Config:
        from_attributes = True


class ExpenseResponse(BaseModel):
    id: str
    user_id: str
    amount: Decimal
    category: ExpenseCategory
    merchant: str
    note: Optional[str] = None
    date: date
    is_recurring: bool
    receipt_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OCRReceiptResponse(BaseModel):
    amount: Optional[Decimal] = None
    merchant: Optional[str] = None
    date: Optional[date] = None
    receipt_url: Optional[str] = None

# ──────────────────────────────────────────────────────────────────────
# INCOME SCHEMAS
# ──────────────────────────────────────────────────────────────────────

class IncomeCreate(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0"), description="Income amount")
    source: str = Field(..., min_length=1, max_length=255)
    date: Optional[date] = None

    class Config:
        from_attributes = True


class IncomeResponse(BaseModel):
    id: str
    user_id: str
    amount: Decimal
    source: str
    month: date
    date: date
    is_recurring: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────────────────────────────
# RECURRING EXPENSE SCHEMAS
# ──────────────────────────────────────────────────────────────────────

class RecurringExpenseCreate(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0"))
    category: ExpenseCategory
    merchant: str = Field(..., min_length=1, max_length=255)
    note: Optional[str] = None
    frequency: RecurringFrequency
    next_due_date: date


class RecurringExpenseResponse(BaseModel):
    id: str
    user_id: str
    amount: Decimal
    category: ExpenseCategory
    merchant: str
    note: Optional[str] = None
    frequency: RecurringFrequency
    next_due_date: date
    is_active: bool

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────────────────────────────
# BUDGET SCHEMAS
# ──────────────────────────────────────────────────────────────────────

class BudgetCreate(BaseModel):
    month: date = Field(..., description="First day of the budget month (YYYY-MM-01)")
    overall_limit: Decimal = Field(..., gt=Decimal("0"))
    category_limits: Optional[Dict[str, Decimal]] = None
    is_auto_income: Optional[bool] = True


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    month: date
    overall_limit: Decimal
    category_limits: Optional[Dict[str, Decimal]] = None
    is_auto_income: bool

    class Config:
        from_attributes = True


class CategoryBudgetStatus(BaseModel):
    name: str
    limit: Decimal
    spent: Decimal
    remaining: Decimal
    pct: float


class OverallBudgetStatus(BaseModel):
    limit: Decimal
    spent: Decimal
    remaining: Decimal
    pct: float


class BudgetStatusResponse(BaseModel):
    total_income: Decimal
    is_auto_income: bool
    overall: OverallBudgetStatus
    categories: List[CategoryBudgetStatus]

# ──────────────────────────────────────────────────────────────────────
# SAVINGS GOAL SCHEMAS
# ──────────────────────────────────────────────────────────────────────

class SavingsGoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_amount: Decimal = Field(..., gt=Decimal("0"))
    deadline: date


class SavingsGoalResponse(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: date

    class Config:
        from_attributes = True


class SavingsGoalUpdate(BaseModel):
    """Partial update — add savings, change target, or update deadline."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    target_amount: Optional[Decimal] = Field(None, gt=Decimal("0"))
    current_amount: Optional[Decimal] = Field(None, ge=Decimal("0"))
    deadline: Optional[date] = None

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────────────────────────────
# AI ADVISER SCHEMAS
# ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    messages: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SpendingInsight(BaseModel):
    type: str
    message: str
    severity: str

# ──────────────────────────────────────────────────────────────────────
# NOTIFICATION SCHEMAS
# ──────────────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: NotificationType
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────────────────────────────
# MONTHLY REPORT SCHEMAS
# ──────────────────────────────────────────────────────────────────────

class MonthlyReportResponse(BaseModel):
    id: str
    user_id: str
    month: date
    total_income: Decimal
    total_expenses: Decimal
    savings: Decimal
    health_score: int
    report_data: Optional[Dict[str, Any]] = None
    pdf_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────────────
# USER PROFILE SCHEMAS
# ──────────────────────────────────────────────────────────────────────

class UserBadgeResponse(BaseModel):
    id: str
    badge_id: str
    earned_at: datetime

    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    currency: str
    streak: int
    badges: List[UserBadgeResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
