@echo off
echo ===================================================
echo INICIALIZANDO SERVICOS - BATALHA DO ESTREITO 2.0
echo ===================================================

echo.
echo [1/2] Iniciando Servidor Backend (Porta 3000)...
cd fonte
start "Backend - Batalha do Estreito" cmd /k "node server.js"
cd ..

echo.
echo [2/2] Iniciando Portal Promocional (Vite)...
cd website-promo
start "Frontend - Batalha do Estreito" cmd /k "npm run dev"
cd ..

echo.
echo ===================================================
echo Servicos iniciados em novas janelas!
echo Backend: http://localhost:3000
echo Portal Promocional: http://localhost:5173
echo ===================================================
pause
