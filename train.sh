#!/usr/bin/env bash
# GradePilot Model Training Script (macOS / Linux)
set -e

cd "$(dirname "$0")/../backend"

echo "=== Executing GradePilot End-to-End Training Pipeline ==="
if [ -f ".venv/bin/python" ]; then
    .venv/bin/python -m training.train
elif [ -f ".venv/Scripts/python.exe" ]; then
    .venv/Scripts/python.exe -m training.train
else
    python3 -m training.train
fi

echo "=== Training Complete. Model artifacts refreshed in backend/models/ ==="
