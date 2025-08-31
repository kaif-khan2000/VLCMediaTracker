@echo off
echo =================================
echo    MediaTracker Quick Start
echo =================================
echo.
echo This will build and launch the MediaTracker app
echo.
echo Building Angular application...
call npm run build -- --base-href ./
if errorlevel 1 (
    echo.
    echo Build failed! Please check the output above.
    pause
    exit /b 1
)
echo.
echo Angular build completed successfully!
echo.
echo Starting Electron application...
echo Note: GPU warnings can be safely ignored.
echo The developer tools will open to help debug any issues.
echo.
call npm run electron
