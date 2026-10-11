#!/usr/bin/env bash
# GradePilot Development Launcher (macOS / Linux)
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Starting GradePilot FastAPI Backend on port 8000 ==="
cd "$ROOT_DIR/backend"
if [ -f ".venv/bin/uvicorn" ]; then
    .venv/bin/uvicorn app.main:app --reload --port 8000 &
elif [ -f ".venv/Scripts/uvicorn.exe" ]; then
    .venv/Scripts/uvicorn.exe app.main:app --reload --port 8000 &
else
    python3 -m uvicorn app.main:app --reload --port 8000 &
fi
BACKEND_PID=$!

echo "=== Starting GradePilot Next.js Frontend on port 3000 ==="
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo "GradePilot is running!"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
wait
