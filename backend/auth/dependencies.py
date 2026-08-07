"""
Better Auth JWT verification dependency for FastAPI using JWKS.

FastAPI retrieves Better Auth's public keys from the JWKS endpoint
and validates incoming JWT signatures (EdDSA/RS256/etc) dynamically,
avoiding the use of BETTER_AUTH_SECRET.
"""

import os
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import jwt
from jwt.exceptions import PyJWTError  # type: ignore

from database import get_db

# ── Configuration ──────────────────────────────────────────────────────────────
# Retrieve the Better Auth URL. In development, it defaults to http://localhost:3000.
# In production, this should point to your Next.js application URL.
BETTER_AUTH_URL = os.getenv("BETTER_AUTH_URL", "http://localhost:3000").rstrip("/")
JWKS_URL = os.getenv("BETTER_AUTH_JWKS_URL") or f"{BETTER_AUTH_URL}/api/auth/jwks"

# Initialize PyJWKClient. It automatically handles fetching and caching JWK keys.
jwks_client = jwt.PyJWKClient(JWKS_URL, cache_keys=True)  # type: ignore

_bearer = HTTPBearer(auto_error=True)

# ── In-memory cache of user IDs that have already been upserted ────────────────
# Avoids a DB write round-trip on every single authenticated request.
# Resets when the server restarts, which is fine — the upsert is idempotent.
_known_users: set[str] = set()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    FastAPI dependency that:
    1. Extracts the JWT from the Authorization: Bearer header.
    2. Dynamically fetches the signing key from Better Auth's JWKS endpoint.
    3. Verifies the JWT signature (EdDSA/RS256/etc) and validates claims.
    4. Extracts user identity from the JWT payload.
    5. Auto-provisions (upserts) the user into the app `users` table (first time only).
    6. Returns the string user_id for use in route handlers.
    """
    token = credentials.credentials

    # ── 1. Verify and decode the JWT ───────────────────────────────────────
    try:
        # Retrieve the public key matching the kid in the JWT header
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Verify the signature against the public key
        # Better Auth uses EdDSA (Ed25519) by default for public/private key signing.
        payload = jwt.decode(  # type: ignore
            token,
            signing_key.key,
            algorithms=["EdDSA", "RS256", "ES256"],
            options={"verify_aud": False}
        )

    except Exception as e:
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

    # ── 3. Upsert into application `users` table (first encounter only) ───
    # Skip the DB write if we've already seen this user this server lifetime.
    if user_id not in _known_users:
        email = payload.get("email", "")
        name = payload.get("name", "")

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
                "now": datetime.now(),
            },
        )
        await db.commit()
        _known_users.add(user_id)

    return user_id

