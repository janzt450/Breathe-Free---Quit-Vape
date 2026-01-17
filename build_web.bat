@echo off
TITLE Build Breathe Free for Neocities

echo ==========================================
echo      Breathe Free - Web Build Tool
echo ==========================================
echo.
echo This script will generate the static files needed
echo for deployment to Neocities.
echo.

echo [1/2] Installing/Updating dependencies...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Building static web assets...
call npm run build:web
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed. Please check the error messages above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================
echo           BUILD SUCCESSFUL!
echo ==========================================
echo.
echo The files are ready in the "dist" folder.
echo.
echo HOW TO DEPLOY TO NEOCITIES:
echo 1. Go to the "dist" folder in this directory.
echo 2. Open your Neocities Dashboard in a browser.
echo 3. Drag and drop ALL files from "dist" (index.html, assets folder, etc.)
echo    into the Neocities file manager.
echo.
pause