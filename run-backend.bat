@echo off
title BurnIt Backend API Server (FastAPI + MySQL)
cd /d "%~dp0backend"

echo ==========================================================
echo           BURNIT BACKEND API SERVER (FASTAPI)
echo ==========================================================
echo  [*] Target Database : MySQL (burnit_db via XAMPP)
echo  [*] API Docs        : http://localhost:8000/docs
echo  [*] Network Host    : 0.0.0.0 (Port 8000)
echo ==========================================================
echo Starting server... Press Ctrl+C to stop.
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend failed to start.
    echo Please make sure Python and Uvicorn are installed.
    pause
)

