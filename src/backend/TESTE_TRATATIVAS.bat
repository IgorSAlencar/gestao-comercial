@echo off
echo Testando conexao e tabela de tratativas de pontos ativos...
echo.

cd /d "%~dp0"
node test-tratativas-connection.js

echo.
pause
