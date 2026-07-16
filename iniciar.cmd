@echo off
title Fazenda Goiaba
cd /d "%~dp0"

rem Se o servidor ja estiver rodando, so abre o navegador
netstat -ano | findstr "LISTENING" | findstr ":5173" >nul 2>&1
if not errorlevel 1 (
  start "" http://localhost:5173
  exit /b
)

rem Inicia o servidor numa janela minimizada e abre o navegador
start "Fazenda Goiaba - servidor (nao feche)" /min "C:\Program Files\nodejs\npm.cmd" run dev
timeout /t 5 /nobreak >nul
start "" http://localhost:5173
exit /b
