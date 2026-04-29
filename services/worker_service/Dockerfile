FROM python:3.10-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY shared /app/shared
COPY worker_service /app/worker_service
# Note: No EXPOSE command needed because it doesn't accept incoming HTTP requests
CMD ["python", "-m", "worker_service.main"]