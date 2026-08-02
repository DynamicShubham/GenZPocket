"""
Better Auth JWT verification dependency for FastAPI.

Better Auth (Next.js) issues short-lived JWTs signed with BETTER_AUTH_SECRET.
FastAPI validates the JWT signature and extracts the user identity from the
token payload — no cookies, no session table lookups.
"""

import os
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from jose import jwt, JWTError

from database import get_db

# ── Configuration ──────────────────────────────────────────────────────────────
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET", "")
if not BETTER_AUTH_SECRET:
    raise RuntimeError(
        "BETTER_AUTH_SECRET environment variable is required for JWT verification. "
        "Set it to the same value used by Better Auth in the Next.js frontend."
    )

# Better Auth JWT plugin signs with HS256 by default when using the secret
JWT_ALGORITHM = "HS256"

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    FastAPI dependency that:
    1. Extracts the JWT from the Authorization: Bearer header.
    2. Verifies the JWT signature using BETTER_AUTH_SECRET.
    3. Extracts user identity from the JWT payload.
    4. Auto-provisions (upserts) the user into the app `users` table.
    5. Returns the string user_id for use in route handlers.
    """
    token = credentials.credentials

    # ── 1. Verify and decode the JWT ───────────────────────────────────────
    try:
        payload = jwt.decode(
            token,
            BETTER_AUTH_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── 2. Extract user identity ───────────────────────────────────────────
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing 'sub' claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email", "")
    name = payload.get("name", "")

    # ── 3. Upsert into application `users` table ──────────────────────────
    # Using raw SQL for simplicity since the `users` table uses different
    # column names from the Better Auth `user` table.
    await db.execute(
        text(
            """
            INSERT INTO users (id, email, name, avatar_url, currency, streak, created_at, updated_at)
            VALUES (:id, :email, :name, NULL, 'INR', 0, :now, :now)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                updated_at = excluded.updated_at
            """
        ),
        {
            "id": user_id,
            "email": email,
            "name": name,
            "now": datetime.now(timezone.utc).isoformat(),
        },
    )
    await db.commit()

    return user_id
