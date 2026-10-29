@echo off
title HORUS - Apertura Inmediata
color 0B
cls
echo ===============================================================================
echo            HORUS - SISTEMA DE ASIGNACION DE STANDS DE AEROPUERTO
echo                 Abriendo visualizador grafico y sincronizador...
echo ===============================================================================
echo.

cd /d "%~dp0"

REM 1. Iniciar motor de sincronizacion en segundo plano si Node esta disponible
where node >nul 2>nul && (
    netstat -ano | findstr ":4000" | findstr "LISTENING" >nul 2>nul || (
        echo [SYNC] Iniciando motor de sincronizacion local en segundo plano...
        start /min "HORUS_SERVER" node server\dist\server.js
        ping 127.0.0.1 -n 3 >nul
    )
)

echo [OK] Abriendo visualizador en el navegador predeterminado...
start "" "%~dp0horus_app.html"

echo.
echo [OK] Listo. Visualizador abierto.
ping 127.0.0.1 -n 2 >nul
exit
