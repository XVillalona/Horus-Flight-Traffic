@echo off
title HORUS Stand Allocation Engine
color 0B
cls
echo ===============================================================================
echo            HORUS - SISTEMA DE ASIGNACION DE STANDS DE AEROPUERTO
echo       Control Visual de Posiciones B20-B37 (B23A/B) - Sincronizacion PUJ
echo ===============================================================================
echo.

cd /d "%~dp0"

REM 1. Verificar si Node.js esta disponible
where node >nul 2>nul || (
    echo [AVISO] Node.js no detectado en el sistema. Abriendo version inmediata...
    start "" "%~dp0horus_app.html"
    exit /b 0
)

echo [OK] Entorno Node.js detectado.

REM 2. Si server\dist\server.js no existe, compilarlo
if not exist "server\dist\server.js" (
    echo [BUILD] Compilando servidor TypeScript...
    call npm run build:server >nul 2>nul
)

REM 3. Lanzar apertura del navegador con retardo para asegurar que el puerto este listo
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:4000"

REM 4. Iniciar el servidor local
echo ===============================================================================
echo  Iniciando servidor local en http://localhost:4000
echo  Sincronizacion en tiempo real con Redash PUJ activa (Terminal B)
echo  (Para detener el sistema, presiona Ctrl + C en esta ventana)
echo ===============================================================================
echo.

if exist "server\dist\server.js" (
    node server\dist\server.js
) else (
    npx tsx server/src/server.ts
)
pause
