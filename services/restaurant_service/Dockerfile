FROM python:3.10-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY shared /app/shared
COPY restaurant_service /app/restaurant_service
EXPOSE 8002
CMD ["uvicorn", "restaurant_service.main:app", "--host", "0.0.0.0", "--port", "8002"]