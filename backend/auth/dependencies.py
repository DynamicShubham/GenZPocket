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
from jwt.exceptions import PyJWTError

from database import get_db

# ── Configuration ──────────────────────────────────────────────────────────────
# Retrieve the Better Auth URL. In development, it defaults to http://localhost:3000.
# In production, this should point to your Next.js application URL.
BETTER_AUTH_URL = os.getenv("BETTER_AUTH_URL", "http://localhost:3000").rstrip("/")
JWKS_URL = os.getenv("BETTER_AUTH_JWKS_URL") or f"{BETTER_AUTH_URL}/api/auth/jwks"

# Initialize PyJWKClient. It automatically handles fetching and caching JWK keys.
print(f"[DEBUG AUTH] Initializing JWKS client pointing to: {JWKS_URL}")
jwks_client = jwt.PyJWKClient(JWKS_URL, cache_keys=True)

_bearer = HTTPBearer(auto_error=True)


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
    5. Auto-provisions (upserts) the user into the app `users` table.
    6. Returns the string user_id for use in route handlers.
    """
    token = credentials.credentials

    # ── 1. Verify and decode the JWT ───────────────────────────────────────
    try:
        # Print token header for diagnostic logs
        unverified_header = jwt.get_unverified_header(token)
        print(f"[DEBUG AUTH] Incoming JWT header: {unverified_header}")

        # Retrieve the public key matching the kid in the JWT header
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Verify the signature against the public key
        # Better Auth uses EdDSA (Ed25519) by default for public/private key signing.
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA", "RS256", "ES256"],
            options={"verify_aud": False}
        )
        print(f"[DEBUG AUTH] Incoming JWT payload verified: {payload}")

    except Exception as e:
        print(f"[DEBUG AUTH ERROR] JWT verification failed: {type(e).__name__}: {e}")
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
            "now": datetime.now(),
        },
    )
    await db.commit()

    return user_id

