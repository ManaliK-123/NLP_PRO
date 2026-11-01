#!/usr/bin/env bash
echo "========================================================"
echo "MEETING -> EXECUTION AI"
echo "NLP-Based Intelligent Meeting Analysis & Execution System"
echo "========================================================"

# Start backend in background
(cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

# Start frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8000 (PID: $BACKEND_PID)"
echo "Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"

wait
