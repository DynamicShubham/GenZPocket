"""
Users router.

Endpoints:
    GET /users/me  - Return the current user's profile (name, email, streak, badges)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import User, UserBadge
from schemas import UserProfileResponse, UserBadgeResponse
from auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Return the authenticated user's profile including streak and badges."""
    # Fetch user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Fetch badges
    badges_result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == user_id)
    )
    badges = badges_result.scalars().all()

    return UserProfileResponse(
        id=user.id, # type: ignore
        email=user.email, # type: ignore
        name=user.name, # type: ignore
        avatar_url=user.avatar_url, # type: ignore
        currency=user.currency, # type: ignore
        streak=user.streak, # type: ignore
        badges=[
            UserBadgeResponse(id=b.id, badge_id=b.badge_id, earned_at=b.earned_at) # type: ignore
            for b in badges
        ],
        created_at=user.created_at, # type: ignore
    )
