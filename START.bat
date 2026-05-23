@echo off
title RFID School Management System - Launcher
color 0A

echo.
echo =====================================================
echo    RFID School Management System - AUTO LAUNCHER
echo =====================================================
echo.

REM Kill any existing processes on port 5000 and 3000
echo [*] Checking for processes on ports 3000 and 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo [*] Ports cleared.
echo.

REM Start Backend
echo [*] Starting Backend Server...
start "RFID Backend (Port 5000)" cmd /k "cd /d d:\RFID2\backend && echo Starting Backend... && npm run dev"

REM Wait 4 seconds before starting frontend
echo [*] Waiting for backend to initialize...
timeout /t 4 /nobreak >nul

REM Start Frontend
echo [*] Starting Frontend...
start "RFID Frontend (Port 3000)" cmd /k "cd /d d:\RFID2\frontend && echo Starting Frontend... && npm start"

echo.
echo =====================================================
echo  [OK] Both services are now launching!
echo  Backend  --> http://localhost:5000
echo  Frontend --> http://localhost:3000
echo =====================================================
echo.
echo  Close the two new terminal windows to stop services.
echo.
pause
