# Simple Python image
FROM python:3.12-slim-bookworm

# Set working directory
WORKDIR /app

# Install minimal system dependencies for espeak
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends espeak-ng-data wget ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Download Piper binary
RUN wget -q https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz && \
    tar -xzf piper_linux_x86_64.tar.gz && \
    rm piper_linux_x86_64.tar.gz && \
    mv piper /app/piper_bin

# Download Piper voice model (en_US-amy-medium)
RUN mkdir -p /app/piper_models && \
    wget -q -O /app/piper_models/en_US-amy-medium.onnx \
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx" && \
    wget -q -O /app/piper_models/en_US-amy-medium.onnx.json \
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json"

# Copy requirements first (for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_md

# Copy all code
COPY . .

# Environment variables
ENV PIPER_BINARY_PATH=/app/piper_bin/piper
ENV PIPER_MODEL_PATH=/app/piper_models/en_US-amy-medium.onnx
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Start command - Railway injects $PORT, use explicit shell for expansion
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
