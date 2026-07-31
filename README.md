# GenZPocket — Smart Expense Tracker for College Students

GenZPocket is a smart, low-friction expense tracker tailored for college students, utilizing a high-contrast Neo-Brutalist design language. It integrates Next.js 16 (App Router) on the frontend and FastAPI on the backend.

---

## Technical Stack
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Recharts
- **Backend**: FastAPI, Python 3.12+, SQLAlchemy 2.0, Alembic, Celery, Redis, Neon PostgreSQL
- **AI**: OpenAI GPT-5.5 (via backend services)
- **Authentication**: Better Auth (Next.js) + JWT token verification (FastAPI)

---

## Setup & Running Locally

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.12 or higher)
- **PostgreSQL** (Local or Neon Serverless instance)
- **Redis** (Local or remote instance for Celery queue/caching)

### 2. Configuration
- Create and configure `.env.local` in the project root folder (see `.env.local` for template placeholders).
- Create and configure `backend/.env` in the `backend` folder (see `backend/.env` for template placeholders).

---

### 3. Running the Frontend (Next.js)
From the project root directory, run:
```bash
npm run dev
```
The frontend will be available at [http://localhost:3000](http://localhost:3000).

---

### 4. Running the Backend (FastAPI)
From the `backend` directory:
1. Activate the virtual environment:
   - On Windows: `.venv\Scripts\activate`
   - On macOS/Linux: `source .venv/bin/activate`
2. Run the development server with Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```
The backend API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).
The API health check endpoint is at [http://localhost:8000/health](http://localhost:8000/health).

---

### 5. Running Database Migrations (Alembic)
From the `backend` directory, run:
```bash
# Run latest migrations
alembic upgrade head
```

### 6. Running Celery Worker & Beat (Background Jobs)
From the `backend` directory:
```bash
# Run Celery worker
celery -A celery_app worker --loglevel=info

# Run Celery beat scheduler
celery -A celery_app beat --loglevel=info
```
