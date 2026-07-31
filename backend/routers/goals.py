"""
Savings Goals router.

Endpoints:
    POST /goals            - Create a new savings goal
    GET  /goals            - List all goals
    PUT  /goals/{id}       - Update goal (add savings / modify target)
    DELETE /goals/{id}     - Delete a goal
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from typing import List

from database import get_db
from models import SavingsGoal
from schemas import SavingsGoalCreate, SavingsGoalResponse, SavingsGoalUpdate
from auth.dependencies import get_current_user

router = APIRouter(prefix="/goals", tags=["Savings Goals"])


@router.post("", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    payload: SavingsGoalCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    goal = SavingsGoal(
        user_id=user_id,
        name=payload.name,
        target_amount=payload.target_amount,
        current_amount=Decimal("0.00"),
        deadline=payload.deadline,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.get("", response_model=List[SavingsGoalResponse])
async def list_goals(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(SavingsGoal)
        .where(SavingsGoal.user_id == user_id)
        .order_by(SavingsGoal.deadline.asc())
    )
    return result.scalars().all()


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
async def update_goal(
    goal_id: str,
    payload: SavingsGoalUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(SavingsGoal).where(
            SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    # Cap current_amount at target_amount
    if goal.current_amount > goal.target_amount:
        goal.current_amount = goal.target_amount

    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(SavingsGoal).where(
            SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")
    await db.delete(goal)
    await db.commit()
