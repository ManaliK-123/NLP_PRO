# ========================================================
# MEETING -> EXECUTION AI
# NLP-Based Intelligent Meeting Analysis & Execution System
# ========================================================

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " MEETING -> EXECUTION AI" -ForegroundColor Cyan
Write-Host " NLP-Based Intelligent Meeting Analysis & Execution" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$ScriptDir = $PSScriptRoot

Write-Host "Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir\backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "Starting Vite React Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " Application launching!" -ForegroundColor Green
Write-Host " Backend API & Swagger: http://localhost:8000/docs" -ForegroundColor White
Write-Host " Frontend Workspace:    http://localhost:5173" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Green
