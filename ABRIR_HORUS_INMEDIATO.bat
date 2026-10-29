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

REM 1. Verificar y compilar dist si no existe
if not exist "server\dist\server.js" (
    echo [BUILD] Preparando servidor...
    call npm run build:server >nul 2>nul
)

REM 2. Iniciar motor de sincronizacion en segundo plano si Node esta disponible
where node >nul 2>nul && (
    netstat -ano | findstr ":4000" | findstr "LISTENING" >nul 2>nul || (
        echo [SYNC] Iniciando motor de sincronizacion local en segundo plano...
        if exist "server\dist\server.js" (
            start /min "HORUS_SERVER" node server\dist\server.js
        ) else (
            start /min "HORUS_SERVER" npx tsx server\src\server.ts
        )
        timeout /t 2 /nobreak >nul
    )
)

echo [OK] Abriendo visualizador en el navegador...
start "" "http://localhost:4000"

echo.
echo [OK] Listo. Visualizador abierto en http://localhost:4000
timeout /t 2 /nobreak >nul
exit
