#!/bin/sh
set -e

COMMAND="${1:-web}"

case "$COMMAND" in
  worker)
    echo "Starting Celery worker..."
    exec celery -A celery_app worker --loglevel=info
    ;;
  beat)
    echo "Starting Celery beat..."
    exec celery -A celery_app beat --loglevel=info
    ;;
  all)
    echo "Starting Celery beat, worker, and FastAPI server..."
    celery -A celery_app beat --loglevel=info &
    celery -A celery_app worker --loglevel=info &
    exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
    ;;
  web|*)
    echo "Starting FastAPI server..."
    exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
    ;;
esac
