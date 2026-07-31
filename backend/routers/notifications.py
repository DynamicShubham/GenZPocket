"""
Notifications router.

Endpoints:
    GET  /notifications       - List unread (and optionally all) notifications
    PUT  /notifications/{id}/read  - Mark a notification as read
    PUT  /notifications/read-all   - Mark all as read
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List

from database import get_db
from models import Notification
from schemas import NotificationResponse
from auth.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
    unread_only: bool = True,
):
    stmt = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)
    stmt = stmt.order_by(Notification.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.put("/{notif_id}/read", response_model=NotificationResponse)
async def mark_read(
    notif_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id,
            Notification.user_id == user_id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif


@router.put("/read-all", status_code=204)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
