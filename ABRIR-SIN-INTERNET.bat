@echo off
title SWIPE Peracetic - Modo Local Sin Internet
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel% equ 0 (
  echo Iniciando servidor local 100%% sin internet en http://127.0.0.1:8772 ...
  start "" "http://127.0.0.1:8772/"
  python -m http.server 8772 --bind 127.0.0.1
  exit /b 0
)
echo No se encontro Python instalado. Abriendo index.html directamente...
start "" "%~dp0index.html"
