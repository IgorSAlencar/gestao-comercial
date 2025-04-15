@echo off
REM — Pasta onde está este .bat
set ROOT=%~dp0

REM — Front‑end
cd /d "%ROOT%"
start "Front-End Dev" cmd /k "npm run dev"

REM — Back‑end
cd /d "%ROOT%src\backend"
start "Back-End Server" cmd /k "node server-modular.js"

pause
