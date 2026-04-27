# Use an official lightweight Python image
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Prevent Python from writing .pyc files to disc and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# We assume a master requirements.txt sits in the 'services' folder
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the shared directory FIRST (so Docker caches this layer if unchanged)
COPY shared /app/shared

# Copy the user service code
COPY user_service /app/user_service

# Expose the port this specific service will run on
EXPOSE 8001

# Run the FastAPI application
CMD ["uvicorn", "user_service.main:app", "--host", "0.0.0.0", "--port", "8001"]