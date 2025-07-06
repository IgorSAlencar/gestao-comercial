@echo off
REM — Pasta onde está este .bat
set ROOT=%~dp0

echo Iniciando Front-End e Back-End...
echo.

REM — Front‑end
cd /d "%ROOT%"
start "Front-End Dev" cmd /k "npm run dev"

REM — Back‑end
cd /d "%ROOT%src\backend"
start "Back-End Server" cmd /k "node server-modular.js"

echo Front-End e Back-End iniciados com sucesso!
echo Este terminal sera fechado em 3 segundos...
timeout /t 3 /nobreak >nul
exit
