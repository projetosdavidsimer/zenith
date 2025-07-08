@echo off
echo.
echo ========================================
echo  VIZINHO VIRTUAL - INICIANDO DEMO
echo ========================================
echo.

echo [1/3] Iniciando Backend (API Gateway)...
start "Backend API" cmd /k "cd backend\api-gateway && node src\index.js"

echo [2/3] Aguardando backend inicializar...
timeout /t 3 /nobreak > nul

echo [3/3] Iniciando Frontend React...
start "Frontend React" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo  DEMO INICIADO COM SUCESSO!
echo ========================================
echo.
echo URLs de Acesso:
echo  Frontend: http://localhost:3100
echo  Backend:  http://localhost:3000
echo.
echo Credenciais de Demo:
echo  Sindico: sindico@demo.com / demo123
echo  Morador: morador@demo.com / demo123
echo  Admin:   admin@demo.com / demo123
echo.
echo Pressione qualquer tecla para continuar...
pause > nul