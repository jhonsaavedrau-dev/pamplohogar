@echo off
title Editor de datos de PamploHogar
cd /d "%~dp0backend"
echo.
echo   Abriendo el editor de la base de datos...
echo   Aqui se cambian y se borran cosas. Con cuidado.
echo.
call npm run datos
pause
