@echo off
title BurnIt All-In-One Launcher
cd /d "%~dp0"

echo ==========================================================
echo               BURNIT - ALL SERVICES LAUNCHER
echo ==========================================================
echo  [*] Starting FastAPI Backend on port 8000...
echo  [*] Starting Vite Frontend on port 5173...
echo.
echo  Access Points:
echo  - Frontend Web App : https://localhost:5173
echo  - Backend API Docs : http://localhost:8000/docs
echo  - Mobile Wi-Fi     : https://192.168.100.230:5173
echo ==========================================================
echo.

:: Launch Backend in a new window
start "BurnIt Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Launch Frontend in a new window
start "BurnIt Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Both services launched in separate windows!
echo Close their respective windows to stop each service.
timeout /t 5

