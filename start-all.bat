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

:: Launch Backend in a new window
start "BurnIt Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Launch Frontend in a new window
start "BurnIt Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Both services launched in separate windows!
echo Close their respective windows to stop each service.
timeout /t 5
