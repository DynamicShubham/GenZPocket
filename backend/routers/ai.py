"""
AI Adviser router.

Endpoints:
    POST /ai/chat                - Send a message to the AI adviser
    GET  /ai/conversations       - List conversations
    GET  /ai/conversations/{id}  - Get a specific conversation
    GET  /ai/insights            - Get auto-generated spending insights
    GET  /ai/affordability       - "Can I afford X?" check
"""

import os
import json
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from openai import AsyncOpenAI

from database import get_db
from models import AIConversation, Expense, Budget, User
from schemas import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    SpendingInsight,
)
from auth.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Adviser"])

_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

# ── System Prompt ──────────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are GenZPocket's AI financial adviser — a friendly, non-judgmental money friend for college students.

Your tone: casual, direct, Gen-Z friendly. Use light emoji. Never be preachy or lecture-y.
Your job: help students understand their spending, give practical tips, and answer money questions clearly.

Key rules:
- Keep answers short (3-5 sentences max unless asked for detail).
- Always ground advice in the user's actual data when provided.
- If you don't have enough context, ask a clarifying question instead of guessing.
- Currency is Indian Rupees (₹) by default.
- Never make up financial data — only use what's in the context provided.
"""


async def _get_user_context(user_id: str, db: AsyncSession) -> str:
    """Build a brief context string with user's current month spending."""
    today = date.today()
    month_start = today.replace(day=1)

    # Current month spending by category
    rows = await db.execute(
        select(Expense.category, text("SUM(amount) as total"))
        .where(
            Expense.user_id == user_id,
            Expense.date >= month_start,
            Expense.date <= today,
        )
        .group_by(Expense.category)
    )
    category_totals = {row.category: float(row.total) for row in rows.fetchall()}
    total_spent = sum(category_totals.values())

    # Budget
    budget_result = await db.execute(
        select(Budget).where(Budget.user_id == user_id, Budget.month == month_start)
    )
    budget = budget_result.scalar_one_or_none()
    budget_info = (
        f"Monthly budget: ₹{float(budget.overall_limit):.0f}, spent so far: ₹{total_spent:.0f}"
        if budget
        else "No budget set for this month."
    )

    lines = [
        f"Current month ({month_start.strftime('%B %Y')}) spending:",
        *[f"  {cat}: ₹{total:.0f}" for cat, total in category_totals.items()],
        f"  TOTAL: ₹{total_spent:.0f}",
        budget_info,
    ]
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# CHAT
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Send a message to the AI adviser. Continues an existing conversation or starts a new one."""
    # Load or create conversation
    conversation: Optional[AIConversation] = None
    if payload.conversation_id:
        result = await db.execute(
            select(AIConversation).where(
                AIConversation.id == payload.conversation_id,
                AIConversation.user_id == user_id,
            )
        )
        conversation = result.scalar_one_or_none()

    if not conversation:
        conversation = AIConversation(user_id=user_id, messages=[])
        db.add(conversation)
        await db.flush()  # get the ID

    messages: list = list(conversation.messages)

    # Build context for first message in session
    context = await _get_user_context(user_id, db)

    # Build OpenAI messages list
    openai_messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "system", "content": f"User financial context:\n{context}"},
        *[{"role": m["role"], "content": m["content"]} for m in messages],
        {"role": "user", "content": payload.message},
    ]

    # Call OpenAI
    try:
        response = await _client.chat.completions.create(
            model="gpt-4o-mini",  # fast, cost-effective for chat
            messages=openai_messages,
            max_tokens=400,
            temperature=0.7,
        )
        reply = response.choices[0].message.content or "Sorry, I couldn't generate a response."
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {str(e)}",
        )

    # Persist messages
    messages.append({"role": "user", "content": payload.message, "timestamp": datetime.utcnow().isoformat()})
    messages.append({"role": "assistant", "content": reply, "timestamp": datetime.utcnow().isoformat()})
    conversation.messages = messages

    await db.commit()
    await db.refresh(conversation)

    return ChatResponse(reply=reply, conversation_id=conversation.id)


# ─────────────────────────────────────────────────────────────────────────────
# CONVERSATIONS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(AIConversation)
        .where(AIConversation.user_id == user_id)
        .order_by(AIConversation.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/conversations/{conv_id}", response_model=ConversationResponse)
async def get_conversation(
    conv_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(AIConversation).where(
            AIConversation.id == conv_id,
            AIConversation.user_id == user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv


# ─────────────────────────────────────────────────────────────────────────────
# INSIGHTS — spending anomaly detection
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/insights", response_model=list[SpendingInsight])
async def get_insights(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Generate rule-based + AI spending insights for the current month."""
    today = date.today()
    month_start = today.replace(day=1)
    last_month_start = (month_start.replace(day=1) if month_start.month > 1
                        else month_start.replace(year=month_start.year - 1, month=12, day=1))

    # This month category totals
    rows = await db.execute(
        select(Expense.category, text("SUM(amount) as total"))
        .where(Expense.user_id == user_id, Expense.date >= month_start, Expense.date <= today)
        .group_by(Expense.category)
    )
    this_month = {r.category: float(r.total) for r in rows.fetchall()}

    # Last month category totals
    rows2 = await db.execute(
        select(Expense.category, text("SUM(amount) as total"))
        .where(
            Expense.user_id == user_id,
            Expense.date >= last_month_start,
            Expense.date < month_start,
        )
        .group_by(Expense.category)
    )
    last_month = {r.category: float(r.total) for r in rows2.fetchall()}

    insights: list[SpendingInsight] = []

    # Rule-based: flag categories where spend increased >30%
    for cat, amount in this_month.items():
        prev = last_month.get(cat, 0)
        if prev > 0:
            change_pct = ((amount - prev) / prev) * 100
            if change_pct >= 30:
                insights.append(
                    SpendingInsight(
                        type="spike",
                        message=f"Your {cat.lower()} spending is up {change_pct:.0f}% vs last month (₹{int(prev)} → ₹{int(amount)}).",
                        severity="warning",
                    )
                )
        elif amount > 500:
            insights.append(
                SpendingInsight(
                    type="new_category",
                    message=f"New spending in {cat.lower()} this month: ₹{int(amount)}.",
                    severity="info",
                )
            )

    if not insights:
        insights.append(
            SpendingInsight(
                type="all_good",
                message="Your spending looks stable compared to last month. Keep it up! 🎉",
                severity="success",
            )
        )

    return insights


# ─────────────────────────────────────────────────────────────────────────────
# AFFORDABILITY CHECK
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/affordability")
async def affordability_check(
    amount: float = Query(..., gt=0, description="Amount to check in ₹"),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Quick affordability check: can the user spend X rupees today?"""
    today = date.today()
    month_start = today.replace(day=1)

    # Get budget
    budget_result = await db.execute(
        select(Budget).where(Budget.user_id == user_id, Budget.month == month_start)
    )
    budget = budget_result.scalar_one_or_none()

    if not budget:
        return {
            "can_afford": None,
            "message": "No budget set — I can't check affordability. Set a monthly budget first!",
        }

    # Total spent this month
    spent_result = await db.execute(
        text(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = :uid AND date >= :start AND date <= :today"
        ),
        {"uid": user_id, "start": month_start.isoformat(), "today": today.isoformat()},
    )
    total_spent = float(spent_result.fetchone().total)
    remaining = float(budget.overall_limit) - total_spent

    # Days logic
    import calendar
    days_in_month = calendar.monthrange(today.year, today.month)[1]  # exact days in current month
    days_left = days_in_month - today.day + 1
    safe_daily = remaining / days_left if days_left > 0 else 0

    can_afford = amount <= remaining
    pct_of_remaining = (amount / remaining * 100) if remaining > 0 else 999

    if can_afford:
        msg = (
            f"Yeah, you can afford ₹{int(amount)}! You have ₹{int(remaining)} left "
            f"for the month ({days_left} days). That's ₹{int(safe_daily)}/day to stay on track."
        )
    else:
        msg = (
            f"Tough one — you only have ₹{int(remaining)} left for the month "
            f"and ₹{int(amount)} would blow that. Maybe wait or find something cheaper? 🤔"
        )

    return {
        "can_afford": can_afford,
        "remaining_budget": remaining,
        "days_left_in_month": days_left,
        "safe_daily_spend": round(safe_daily, 2),
        "pct_of_remaining": round(pct_of_remaining, 1),
        "message": msg,
    }
