"""
Celery Configuration and Task Queue Initialization (Task 4.1).

Runs background tasks for:
- Auto-applying recurring expenses (Task 4.3)
- Weekly notification summaries (Task 4.4)
- Monthly report compilation (Task 6.4)
"""

import os
from celery import Celery
from celery.schedules import crontab

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "genzpocket_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        # Run daily at 00:05 UTC to auto-apply due recurring expenses (Task 4.3)
        "apply-due-recurring-expenses-daily": {
            "task": "tasks.apply_due_recurring_expenses",
            "schedule": crontab(hour=0, minute=5),
        },
        # Run weekly on Sunday midnight UTC for weekly budget alerts (Task 4.4)
        "send-weekly-budget-summaries": {
            "task": "tasks.send_weekly_budget_summaries",
            "schedule": crontab(day_of_week=0, hour=0, minute=0),
        },
        # Run monthly on the 1st day of the month at 01:00 UTC (Task 6.4)
        "compile-monthly-reports": {
            "task": "tasks.compile_monthly_reports",
            "schedule": crontab(day_of_month=1, hour=1, minute=0),
        },
    },
)
