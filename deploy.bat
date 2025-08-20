@echo off
REM Удобный скрипт для быстрого доступа к деплою (Windows)
REM Использование: deploy.bat [frontend|backend|all]

set SCRIPT_DIR=%~dp0
set DEPLOY_DIR=%SCRIPT_DIR%scripts\deploy

REM Проверка аргументов
if "%1"=="" (
    echo 🚀 Скрипты деплоя Super Mock
    echo.
    echo Использование:
    echo   deploy.bat frontend  - обновить только фронтенд
    echo   deploy.bat backend   - обновить только бэкенд
    echo   deploy.bat all       - обновить фронтенд и бэкенд
    echo.
    echo 📖 Документация: %DEPLOY_DIR%\README.md
    exit /b 1
)

REM Переход в папку скриптов
cd /d "%DEPLOY_DIR%"

REM Выполнение соответствующего скрипта
if "%1"=="frontend" (
    echo 🎯 Запуск обновления фронтенда...
    bash deploy-frontend.sh
) else if "%1"=="backend" (
    echo 🎯 Запуск обновления бэкенда...
    bash deploy-backend.sh
) else if "%1"=="all" (
    echo 🎯 Запуск полного обновления...
    bash deploy-all.sh
) else (
    echo ❌ Неизвестная команда: %1
    echo Доступные команды: frontend, backend, all
    exit /b 1
)
