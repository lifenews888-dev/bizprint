@echo off
title BizPrint — Backend + ngrok

echo.
echo  ====================================
echo   BizPrint Server Launcher
echo  ====================================
echo.

:: Start backend in new window
echo [1/2] Starting Backend (port 4000)...
start "BizPrint Backend" cmd /k "cd /d C:\Users\User\projects\bizprint\backend && npm run start:dev"

:: Wait for backend to boot
echo     Waiting 8 seconds for backend to boot...
timeout /t 8 /nobreak >nul

:: Start ngrok in new window
echo [2/2] Starting ngrok tunnel...
start "BizPrint ngrok" cmd /k "ngrok http --domain=intuitive-shayne-periodically.ngrok-free.dev 4000"

echo.
echo  ====================================
echo   Done! App is ready.
echo   API: https://intuitive-shayne-periodically.ngrok-free.dev
echo  ====================================
echo.
echo  Both windows opened. Keep them running.
echo  Press any key to close this window...
pause >nul
