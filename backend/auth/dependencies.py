"""
Better Auth session verification dependency for FastAPI.

Better Auth (JS/Node) writes session data to the SQLite database directly.
FastAPI reads the session table to verify tokens and upserts users into the
application `users` table (which holds app-specific fields like streak, currency).
"""

import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from database import get_db

# We use HTTPBearer but also accept the cookie "better-auth.session_token"
_bearer = HTTPBearer(auto_error=False)


async def _resolve_session_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> str:
    """Extract session token from Authorization header OR cookie."""
    # 1. Try Authorization: Bearer <token>
    if credentials and credentials.scheme.lower() == "bearer":
        return credentials.credentials

    # 2. Fallback: cookie set by Better Auth client
    token = request.cookies.get("better-auth.session_token") or request.cookies.get("better-auth.session-token")
    if token:
        return token

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide a Bearer token or session cookie.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    token: str = Depends(_resolve_session_token),
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    FastAPI dependency that:
    1. Validates the Better Auth session token against the `session` table.
    2. Auto-provisions (upserts) the user into the app `users` table.
    3. Returns the string user_id for use in route handlers.
    """
    # ── 1. Look up the session ──────────────────────────────────────────
    result = await db.execute(
        text(
            """
            SELECT s.userId, s.expiresAt, u.name, u.email, u.image
            FROM session s
            JOIN "user" u ON u.id = s.userId
            WHERE s.token = :token
            LIMIT 1
            """
        ),
        {"token": token},
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id, expires_at, name, email, image = row

    # ── 2. Check expiry ─────────────────────────────────────────────────
    # Better Auth stores dates as ISO strings or timestamps in the database
    if isinstance(expires_at, str):
        try:
            expires_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        except ValueError:
            expires_dt = datetime.fromisoformat(expires_at)
    else:
        expires_dt = expires_at

    # Make expires_dt timezone-aware for comparison
    if expires_dt.tzinfo is None:
        expires_dt = expires_dt.replace(tzinfo=timezone.utc)

    if expires_dt < datetime.now(tz=timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── 3. Upsert into application `users` table ─────────────────────────
    # Using raw SQL for simplicity since the `users` table uses different
    # column names from the Better Auth `user` table.
    await db.execute(
        text(
            """
            INSERT INTO users (id, email, name, avatar_url, currency, streak, created_at, updated_at)
            VALUES (:id, :email, :name, :avatar_url, 'INR', 0, :now, :now)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                avatar_url = excluded.avatar_url,
                updated_at = excluded.updated_at
            """
        ),
        {
            "id": user_id,
            "email": email,
            "name": name or "",
            "avatar_url": image or None,
            "now": datetime.now(timezone.utc).isoformat(),
        },
    )
    await db.commit()

    return user_id
