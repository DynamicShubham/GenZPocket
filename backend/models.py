import uuid
import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from database import Base

def utc_now():
    return datetime.now(timezone.utc)

# ──────────────────────────────────────────────────────────────────────
# ENUMS
# ──────────────────────────────────────────────────────────────────────

class ExpenseCategory(str, enum.Enum):
    FOOD = "FOOD"
    TRAVEL = "TRAVEL"
    SHOPPING = "SHOPPING"
    ENTERTAINMENT = "ENTERTAINMENT"
    SUBSCRIPTIONS = "SUBSCRIPTIONS"
    EDUCATION = "EDUCATION"
    HEALTH = "HEALTH"
    UTILITIES = "UTILITIES"
    RENT = "RENT"
    OTHER = "OTHER"


class RecurringFrequency(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"


class NotificationType(str, enum.Enum):
    BUDGET_50 = "BUDGET_50"
    BUDGET_80 = "BUDGET_80"
    BUDGET_100 = "BUDGET_100"
    WEEKLY_CHECKIN = "WEEKLY_CHECKIN"
    RECURRING_DUE = "RECURRING_DUE"

# ──────────────────────────────────────────────────────────────────────
# MODELS
# ──────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    # ID is String to align with Better Auth string IDs
    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(1024), nullable=True)
    currency = Column(String(10), default="INR", nullable=False)
    
    # Gamification fields (added proactively from Phase 18 T-112)
    streak = Column(Integer, default=0, nullable=False)
    last_logged_date = Column(Date, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    recurring_expenses = relationship("RecurringExpense", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("MonthlyReport", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    amount = Column(Numeric(12, 2), nullable=False)
    category = Column(Enum(ExpenseCategory), nullable=False)
    merchant = Column(String(255), nullable=False)
    note = Column(String(1024), nullable=True)
    date = Column(Date, nullable=False, default=date.today)
    is_recurring = Column(Boolean, default=False, nullable=False)
    receipt_url = Column(String(1024), nullable=True)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="expenses")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Represents the 1st day of the budgeted month (e.g. 2026-07-01)
    month = Column(Date, nullable=False)
    overall_limit = Column(Numeric(12, 2), nullable=False)
    
    # category_limits will store dict of {CATEGORY_NAME: limit}
    category_limits = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="budgets")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    deadline = Column(Date, nullable=False)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="goals")


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    amount = Column(Numeric(12, 2), nullable=False)
    category = Column(Enum(ExpenseCategory), nullable=False)
    merchant = Column(String(255), nullable=False)
    note = Column(String(1024), nullable=True)
    
    frequency = Column(Enum(RecurringFrequency), nullable=False)
    next_due_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="recurring_expenses")


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # JSON list of dicts: [{"role": "user", "content": "hello", "timestamp": "ISO-format"}]
    messages = Column(JSON, nullable=False, default=list)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="conversations")


class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Store first day of month
    month = Column(Date, nullable=False)
    total_income = Column(Numeric(12, 2), nullable=False, default=0.00)
    total_expenses = Column(Numeric(12, 2), nullable=False, default=0.00)
    savings = Column(Numeric(12, 2), nullable=False, default=0.00)
    health_score = Column(Integer, nullable=False, default=0)
    
    # category details and visual summaries
    report_data = Column(JSON, nullable=True)
    pdf_url = Column(String(1024), nullable=True)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="reports")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    type = Column(Enum(NotificationType), nullable=False)
    message = Column(String(1024), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(String(255), nullable=False)
    earned_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="badges")
