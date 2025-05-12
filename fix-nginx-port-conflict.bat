@echo off
REM Скрипт для исправления конфликта портов в Docker для Windows
REM Автор: Roo
REM Дата: 13.05.2025

echo === Исправление конфликта портов в Docker для Windows ===

REM Шаг 1: Остановка всех контейнеров
echo [%date% %time%] Останавливаем все контейнеры...
docker-compose down

REM Шаг 2: Очистка проблемных директорий
echo [%date% %time%] Очищаем проблемные директории...
if exist "nginx-config.conf;C" (
  echo [%date% %time%] Удаляем директорию nginx-config.conf;C
  rmdir /s /q "nginx-config.conf;C"
)

REM Шаг 3: Пересборка образов
echo [%date% %time%] Пересобираем образы Docker...
docker-compose build --no-cache frontend nginx

REM Шаг 4: Запуск контейнеров
echo [%date% %time%] Запускаем контейнеры...
docker-compose up -d

REM Шаг 5: Проверка статуса контейнеров
echo [%date% %time%] Проверяем статус контейнеров...
docker-compose ps

REM Шаг 6: Проверка доступности API
echo [%date% %time%] Проверяем доступность API...
timeout /t 5 /nobreak > nul
curl -I http://localhost:9080/api

echo [%date% %time%] Исправление завершено. Проверьте результаты выше для определения успешности исправления.
echo [%date% %time%] Если проблема не решена, проверьте следующие возможные причины:
echo [%date% %time%] 1. Проблемы с сетевым взаимодействием между контейнерами
echo [%date% %time%] 2. Проблемы с конфигурацией Nginx
echo [%date% %time%] 3. Проблемы с переменными окружения

echo.
echo === Итоги исправления ===
echo Внесены следующие изменения:
echo 1. Изменен порт в react-frontend/nginx.conf с 80 на 3000
echo 2. Изменен порт в docker-compose.yml для frontend с '${FRONTEND_PORT:-3000}:80' на '${FRONTEND_PORT:-3000}:3000'
echo 3. Изменено проксирование в nginx/nginx.conf с http://frontend:80 на http://frontend:3000
echo.

pause