@echo off
title PamploHogar
echo.
echo   ================================================
echo    PamploHogar - encendiendo la plataforma
echo   ================================================
echo.
echo   Se van a abrir dos ventanas negras. NO LAS CIERRES:
echo   son el motor de la plataforma.
echo.
echo   Para apagar todo, cierra esas dos ventanas.
echo.

cd /d "%~dp0"

start "PamploHogar - servidor" cmd /k "cd /d %~dp0backend && npm run dev"
start "PamploHogar - pagina" cmd /k "cd /d %~dp0frontend && npm run dev"

echo   Esperando a que arranque...
timeout /t 12 /nobreak >nul

start http://localhost:5173

echo.
echo   Listo. Se abrio PamploHogar en tu navegador.
echo   Si no se abrio solo, entra a:  http://localhost:5173
echo.
pause
