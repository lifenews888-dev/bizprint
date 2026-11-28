@echo off
echo Stopping existing node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul
echo Starting BizPrint backend...
cd C:\Users\User\projects\01-bizprint\bizprint\backend
npm run start:dev
