# Redis Integration Plan (Caching, Rate Limiting & Celery)

Based on the project's tech stack, Redis is intended to handle three major responsibilities:
1. **Message Broker / Backend for Background Jobs** (Celery)
2. **Rate Limiting** (to prevent API abuse)
3. **Caching** (for faster load times on heavy endpoints)

Here is how we will implement "the rest" of the Redis management:

## Open Questions
- Do you want to apply rate limiting globally, or only on intensive endpoints like the AI Adviser (`/ai/chat`) and Report Generation (`/reports/generate`)?
- Should I start a background terminal process for the Celery worker and Celery Beat so your background jobs actually start processing?

## Proposed Changes

---

### 1. Dependencies
We will install standard FastAPI libraries to handle caching and rate limiting.
- **Run**: `pip install fastapi-cache2[redis] fastapi-limiter`
- Add these to `backend/requirements.txt`.

---

### 2. FastAPI Lifecycle & Initialization

#### [MODIFY] [main.py](file:///d:/projects/GenZPocket/backend/main.py)
- Import `FastAPICache` and `FastAPILimiter`.
- Add a `@app.on_event("startup")` (or lifespan) hook to:
  - Create a global `redis.asyncio` connection pool using the `REDIS_URL` from your `.env`.
  - Initialize the `FastAPICache` with a Redis backend.
  - Initialize the `FastAPILimiter` with the same Redis connection.
- Close the Redis connection gracefully on application shutdown.

---

### 3. Rate Limiting & Caching Endpoints

#### [MODIFY] [ai.py](file:///d:/projects/GenZPocket/backend/routers/ai.py)
- Decorate AI endpoints (e.g., `/ai/chat`) with `@limiter.limit("5/minute")` to prevent OpenAI API abuse.

#### [MODIFY] [users.py](file:///d:/projects/GenZPocket/backend/routers/users.py)
- Decorate static user profile elements or leaderboards with `@cache(expire=60)` to cache the data in Redis for 60 seconds, reducing database hits.

#### [MODIFY] [reports.py](file:///d:/projects/GenZPocket/backend/routers/reports.py)
- Add rate limits to report generation triggers (`@limiter.limit("2/minute")`).

---

## Verification Plan

### Automated Tests
- Validate that the FastAPI app boots up successfully and successfully connects to the local Redis instance without errors.

### Manual Verification
- We will hit the AI endpoint rapidly to verify the rate limiter blocks excess requests (HTTP 429).
- We will fetch a cached endpoint twice and verify via response times/logs that the second request serves instantly from Redis.
- We will start the Celery worker and verify it connects to the Redis broker successfully.
