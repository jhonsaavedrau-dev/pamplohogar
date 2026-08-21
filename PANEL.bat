@echo off
title Panel de PamploHogar
cd /d "%~dp0backend"
echo.
echo   Abriendo el panel de PamploHogar...
echo.
start "" http://localhost:4321
call npm run panel
echo.
echo   El panel se apago. Puedes cerrar esta ventana.
pause
