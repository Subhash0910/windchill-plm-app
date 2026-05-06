FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories
RUN mkdir -p /app/models /app/data /app/logs

# Train the model at build time (bakes real RF model into image).
# matplotlib/seaborn are only needed for training plots — install, train, remove.
RUN pip install --no-cache-dir matplotlib==3.8.2 seaborn==0.13.1 && \
    python training/generate_training_data.py && \
    python training/train_model.py && \
    pip uninstall -y matplotlib seaborn

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Run application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
