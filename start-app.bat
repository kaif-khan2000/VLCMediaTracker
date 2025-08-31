@echo off
echo Building and starting MediaTracker...
echo.
echo Building Angular application...
npm run build
echo.
echo Starting Electron application...
npm run electron
echo.
echo If you see any GPU errors, they can be safely ignored.
pause
