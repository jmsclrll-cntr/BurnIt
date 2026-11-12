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

:: Check if MySQL is running on port 3306
netstat -ano | findstr /R /C:":3306 " >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] MySQL port 3306 is not active. Checking XAMPP...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo [INFO] Starting XAMPP MySQL service...
        start "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >nul
    ) else (
        echo [NOTICE] XAMPP MySQL not detected. Please ensure MySQL is started via XAMPP Control Panel.
    )
) else (
    echo [OK] MySQL is active on port 3306.
)

echo.
echo Starting FastAPI server... Press Ctrl+C to stop.
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend failed to start.
    echo Please make sure Python and Uvicorn are installed.
    pause
)
