@echo off
title SFM 3D Viewer
echo Killing existing server processes...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /v ^| findstr "serve"') do (
  taskkill /f /pid %%i >nul 2>&1
)

echo Starting server...
cd /d "%~dp0"
start "" http://localhost:3000
npx serve . -l 3000
pause
