@echo off
TITLE Build Breathe Free for Windows

echo ==========================================
echo      Breathe Free - Windows Build Tool
echo ==========================================
echo.
echo [1/3] Installing dependencies (including Tailwind)...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Building application...
call npm run build
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Build Complete!
echo Check the "dist_electron" folder for the installer.
echo.
pause