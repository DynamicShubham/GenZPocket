"""
Celery Background Tasks — Executable tasks for scheduled jobs.

Tasks:
- apply_due_recurring_expenses (Task 4.3)
- send_weekly_budget_summaries (Task 4.4)
- compile_monthly_reports (Task 6.4)
"""

import asyncio
from datetime import date
from celery_app import celery_app


# Helper for running async database functions inside synchronous Celery workers
def run_async(coro):
    return asyncio.run(coro)


@celery_app.task(name="tasks.apply_due_recurring_expenses")
def apply_due_recurring_expenses():
    """Task 4.3: Auto-apply recurring expenses due today or earlier."""
    from database import async_session
    from models import RecurringExpense, Expense, RecurringFrequency
    from sqlalchemy import select
    from dateutil.relativedelta import relativedelta
    from datetime import timedelta

    async def _impl():
        async with async_session() as db:
            today = date.today()
            stmt = select(RecurringExpense).where(
                RecurringExpense.is_active == True,
                RecurringExpense.next_due_date <= today,
            )
            result = await db.execute(stmt)
            recurring_items = result.scalars().all()

            applied_count = 0
            for rec in recurring_items:
                # Log expense
                expense = Expense(
                    user_id=rec.user_id,
                    amount=rec.amount,
                    category=rec.category,
                    merchant=rec.merchant,
                    note=f"[Auto] {rec.note or rec.merchant}",
                    date=rec.next_due_date,
                    is_recurring=True,
                )
                db.add(expense)

                # Advance next_due_date
                if rec.frequency == RecurringFrequency.DAILY:
                    rec.next_due_date += timedelta(days=1)
                elif rec.frequency == RecurringFrequency.WEEKLY:
                    rec.next_due_date += timedelta(weeks=1)
                elif rec.frequency == RecurringFrequency.MONTHLY:
                    rec.next_due_date += relativedelta(months=1)

                applied_count += 1

            await db.commit()
            return f"Applied {applied_count} recurring expenses."

    return run_async(_impl())


@celery_app.task(name="tasks.send_weekly_budget_summaries")
def send_weekly_budget_summaries():
    """Task 4.4: Send weekly budget summary notifications."""
    from database import async_session
    from models import User, Notification, NotificationType
    from services.budget_alerts import check_budget_alerts
    from sqlalchemy import select

    async def _impl():
        async with async_session() as db:
            result = await db.execute(select(User.id))
            user_ids = result.scalars().all()

            for uid in user_ids:
                await check_budget_alerts(uid, db)
                n = Notification(
                    user_id=uid,
                    message="Check your dashboard to see your weekly spending progress & remaining budget!",
                    type=NotificationType.WEEKLY_CHECKIN,
                )
                db.add(n)

            await db.commit()
            return f"Sent weekly budget summaries to {len(user_ids)} users."

    return run_async(_impl())


@celery_app.task(name="tasks.compile_monthly_reports")
def compile_monthly_reports():
    """Task 6.4: Monthly task to generate and store monthly reports for all active users."""
    from database import async_session
    from models import User
    from services.report_generator import generate_monthly_report
    from sqlalchemy import select

    async def _impl():
        async with async_session() as db:
            result = await db.execute(select(User.id))
            user_ids = result.scalars().all()

            compiled_count = 0
            for uid in user_ids:
                try:
                    await generate_monthly_report(uid, db)
                    compiled_count += 1
                except Exception as e:
                    print(f"Failed generating report for user {uid}: {e}")

            return f"Compiled {compiled_count} monthly reports."

    return run_async(_impl())
