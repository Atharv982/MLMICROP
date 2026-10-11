#!/usr/bin/env bash
# GradePilot Environment Setup Script (macOS / Linux)
set -e

echo "=== Setting up GradePilot Backend ==="
cd "$(dirname "$0")/../backend"

if command -v uv &> /dev/null; then
    echo "Using uv for lightning-fast Python setup..."
    uv venv --python 3.11 .venv
    uv pip install -r requirements.txt --python .venv/bin/python
else
    echo "Creating virtualenv with standard Python..."
    python3 -m venv .venv
    source .venv/bin/activate
    python3 -m pip install --upgrade pip
    pip install -r requirements.txt
fi

echo "=== Training Models ==="
if [ -d ".venv/bin" ]; then
    .venv/bin/python -m training.train
else
    .venv/Scripts/python.exe -m training.train
fi

echo "=== Setting up GradePilot Frontend ==="
cd "../frontend"
npm install
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
fi

echo "=== GradePilot Setup Complete ==="
echo "To start development servers, run: ./scripts/run-dev.sh"
