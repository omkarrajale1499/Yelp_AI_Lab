FROM python:3.10-slim
WORKDIR /app

# 1. Explicitly grab the AI service's specific requirements!
COPY ai_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copy the AI service code AND the shared folder into the container
COPY ai_service/ .
COPY shared/ ./shared/

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004", "--reload"]