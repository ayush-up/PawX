# Use a lightweight Python base image
FROM python:3.10-slim

# Set environment variables for AI stability
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NUMBA_CACHE_DIR=/tmp/numba_cache \
    HOME=/tmp

# Install system dependencies for OpenCV and AI libraries
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port Hugging Face expects (7860)
EXPOSE 7860

# Run the application using gunicorn
# Note: Hugging Face expects the port to be 7860 inside the container
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:7860", "--timeout", "600"]
