@echo off
setlocal
cd /d "%~dp0HealthMonitorApp\my-health-app"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js, then run this launcher again.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Installing frontend dependencies. Internet is needed for this first setup.
  call npm.cmd ci
  if errorlevel 1 (
    echo Dependency installation failed. Check your connection and try again.
    pause
    exit /b 1
  )
)
echo Starting PulseLink. Keep this window open during your demo.
echo Press Ctrl+C to stop the server.
call npm.cmd run dev -- --host 127.0.0.1 --open
if errorlevel 1 pause
