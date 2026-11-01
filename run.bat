@echo off
echo ========================================================
echo MEETING -^> EXECUTION AI
echo NLP-Based Intelligent Meeting Analysis & Execution System
echo ========================================================
echo.

echo Starting FastAPI Backend on http://localhost:8000 ...
start "Meeting Execution Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Vite React Frontend on http://localhost:5173 ...
start "Meeting Execution Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo Application launching!
echo Backend API & Swagger: http://localhost:8000/docs
echo Frontend Workspace:    http://localhost:5173
echo ========================================================
