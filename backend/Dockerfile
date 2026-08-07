FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x start.sh

ENV PORT=8000
EXPOSE 8000

# Default: starts web server.
# To run Celery worker: docker run <image> ./start.sh worker
# (or command: celery -A celery_app worker --loglevel=info)
# To run Celery beat:   docker run <image> ./start.sh beat
# (or command: celery -A celery_app beat --loglevel=info)
# To run all in one:    docker run <image> ./start.sh all
ENTRYPOINT ["./start.sh"]
CMD ["web"]
