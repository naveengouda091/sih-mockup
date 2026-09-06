#!/usr/bin/env bash
echo "======================================================="
echo "  GeoRakshak-NER: Disaster Intelligence Platform"
echo "  SIH 2026 - Problem Statement 1"
echo "======================================================="

# Start backend
(cd backend && uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

# Start frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "GeoRakshak-NER launched!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"

wait $BACKEND_PID $FRONTEND_PID
