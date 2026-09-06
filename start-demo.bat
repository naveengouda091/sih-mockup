@echo off
echo =======================================================
echo   GeoRakshak-NER: Disaster Intelligence Platform
echo   SIH 2026 - Problem Statement 1
echo =======================================================
echo.
echo [1/2] Starting Python FastAPI Backend on http://localhost:8000 ...
start "GeoRakshak-Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

echo [2/2] Starting React Vite GIS Frontend on http://localhost:5173 ...
start "GeoRakshak-Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo GeoRakshak-NER is launching! 
echo Open http://localhost:5173 in your browser to view the Command Center.
echo Press any key to exit this launcher window.
pause >nul
