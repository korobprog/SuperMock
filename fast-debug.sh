#!/bin/bash

# Скрипт для быстрой отладки и перезапуска контейнеров локально
# Поддерживает следующие опции:
# ./fast-debug.sh - копирует все файлы и перезапускает все контейнеры
# ./fast-debug.sh --backend - обновляет и перезапускает только бэкенд
# ./fast-debug.sh --frontend - обновляет и перезапускает только фронтенд
# ./fast-debug.sh --copy-only - только копирует файлы без перезапуска контейнеров

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Парсинг аргументов командной строки
BACKEND_ONLY=false
FRONTEND_ONLY=false
COPY_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --backend)
      BACKEND_ONLY=true
      shift
      ;;
    --frontend)
      FRONTEND_ONLY=true
      shift
      ;;
    --copy-only)
      COPY_ONLY=true
      shift
      ;;
    *)
      warn "Неизвестный аргумент: $1"
      shift
      ;;
  esac
done

# Если указаны оба флага, то это эквивалентно их отсутствию
if [ "$BACKEND_ONLY" = true ] && [ "$FRONTEND_ONLY" = true ]; then
  BACKEND_ONLY=false
  FRONTEND_ONLY=false
  log "Указаны оба флага --backend и --frontend, будут обновлены оба компонента"
fi

# Определяем, какие файлы копировать
COPY_BACKEND=true
COPY_FRONTEND=true

if [ "$BACKEND_ONLY" = true ]; then
  COPY_FRONTEND=false
  log "Режим: только бэкенд"
fi

if [ "$FRONTEND_ONLY" = true ]; then
  COPY_BACKEND=false
  log "Режим: только фронтенд"
fi

# Проверка наличия необходимых директорий
if [ ! -d "backend" ]; then
  error "Директория backend не найдена. Убедитесь, что вы запускаете скрипт из корневой директории проекта."
fi

if [ ! -d "react-frontend" ]; then
  error "Директория react-frontend не найдена. Убедитесь, что вы запускаете скрипт из корневой директории проекта."
fi

# Проверка файлов
log "Проверка файлов..."

# Функция для проверки наличия файлов
check_files() {
  local path="$1"
  
  if [ ! -e "$path" ]; then
    warn "Файл или директория не существует: $path"
    return 1
  fi
  
  log "Проверено: $path (существует)"
  return 0
}

# Проверка файлов бэкенда
if [ "$COPY_BACKEND" = true ]; then
  log "Проверка файлов бэкенда..."
  
  # Проверяем исходные файлы бэкенда
  if [ -d "backend/src" ]; then
    log "Проверка исходных файлов бэкенда..."
    check_files "backend/src"
  else
    warn "Директория backend/src не найдена!"
  fi
  
  # Проверяем конфигурационные файлы бэкенда
  if [ -f "backend/.env.development" ]; then
    check_files "backend/.env.development"
  else
    warn "Файл backend/.env.development не найден!"
  fi
  
  if [ -f "backend/.env.production" ]; then
    check_files "backend/.env.production"
  else
    warn "Файл backend/.env.production не найден!"
  fi
  
  # Проверяем package.json бэкенда
  if [ -f "backend/package.json" ]; then
    check_files "backend/package.json"
  else
    warn "Файл backend/package.json не найден!"
  fi
fi

# Проверка файлов фронтенда
if [ "$COPY_FRONTEND" = true ]; then
  log "Проверка файлов фронтенда..."
  
  # Проверяем исходные файлы фронтенда
  if [ -d "react-frontend/src" ]; then
    log "Проверка исходных файлов фронтенда..."
    check_files "react-frontend/src"
  else
    warn "Директория react-frontend/src не найдена!"
  fi
  
  # Проверяем конфигурационные файлы фронтенда
  if [ -f "react-frontend/.env.development" ]; then
    check_files "react-frontend/.env.development"
  else
    warn "Файл react-frontend/.env.development не найден!"
  fi
  
  if [ -f "react-frontend/.env.production" ]; then
    check_files "react-frontend/.env.production"
  else
    warn "Файл react-frontend/.env.production не найден!"
  fi
  
  # Проверяем package.json фронтенда
  if [ -f "react-frontend/package.json" ]; then
    check_files "react-frontend/package.json"
  else
    warn "Файл react-frontend/package.json не найден!"
  fi
  
  # Проверяем nginx.conf фронтенда
  if [ -f "react-frontend/nginx.conf" ]; then
    check_files "react-frontend/nginx.conf"
  else
    warn "Файл react-frontend/nginx.conf не найден!"
  fi
  
  # Проверяем env.sh фронтенда
  if [ -f "react-frontend/env.sh" ]; then
    check_files "react-frontend/env.sh"
  else
    warn "Файл react-frontend/env.sh не найден!"
  fi
fi

# Проверяем docker-compose.yml
if [ -f "docker-compose.yml" ]; then
  check_files "docker-compose.yml"
else
  warn "Файл docker-compose.yml не найден!"
fi

log "Проверка файлов завершена."

# Если указан флаг --copy-only, то завершаем работу
if [ "$COPY_ONLY" = true ]; then
  log "Проверка завершена. Перезапуск контейнеров не выполняется (--copy-only)."
  exit 0
fi

# Перезапуск контейнеров
log "Перезапуск контейнеров..."

# Проверяем наличие docker и docker-compose
if ! command -v docker &> /dev/null; then
  error "Docker не установлен. Пожалуйста, установите Docker."
fi

if ! command -v docker-compose &> /dev/null; then
  error "Docker Compose не установлен. Пожалуйста, установите Docker Compose."
fi

# Проверяем, запущен ли Docker демон
if ! docker info &> /dev/null; then
  error "Docker демон не запущен. Пожалуйста, запустите Docker."
fi

# Перезапуск контейнеров в зависимости от выбранного режима
if [ "$BACKEND_ONLY" = true ]; then
  # Перезапускаем только контейнер бэкенда
  log "Перезапуск только контейнера бэкенда..."
  
  # Сначала компилируем TypeScript
  log "Компиляция TypeScript для бэкенда..."
  cd backend && npm run build
  
  if [ $? -ne 0 ]; then
    error "Ошибка при компиляции TypeScript. Проверьте логи выше."
  fi
  
  log "Компиляция TypeScript успешно завершена."
  cd ..
  
  # Проверяем, существует ли контейнер
  if docker ps -a | grep -q supermock-backend; then
    log "Контейнер supermock-backend найден, перезапускаем..."
    docker restart supermock-backend
  else
    log "Контейнер supermock-backend не найден, запускаем все контейнеры..."
    docker-compose up -d
  fi
  
  # Проверяем статус контейнера
  log "Проверка статуса контейнера бэкенда..."
  docker ps | grep supermock-backend || log "Контейнер supermock-backend не найден в списке запущенных контейнеров."
  
  # Выводим логи контейнера
  log "Логи контейнера бэкенда:"
  docker logs --tail 20 supermock-backend || log "Не удалось получить логи контейнера supermock-backend."
  
elif [ "$FRONTEND_ONLY" = true ]; then
  # Перезапускаем только контейнер фронтенда
  log "Перезапуск только контейнера фронтенда..."
  
  # Сначала собираем фронтенд
  log "Сборка фронтенда..."
  cd react-frontend && npm run build
  
  if [ $? -ne 0 ]; then
    error "Ошибка при сборке фронтенда. Проверьте логи выше."
  fi
  
  log "Сборка фронтенда успешно завершена."
  cd ..
  
  # Проверяем, существует ли контейнер
  if docker ps -a | grep -q supermock-frontend; then
    log "Контейнер supermock-frontend найден, перезапускаем..."
    docker restart supermock-frontend
  else
    log "Контейнер supermock-frontend не найден, запускаем все контейнеры..."
    docker-compose up -d
  fi
  
  # Проверяем статус контейнера
  log "Проверка статуса контейнера фронтенда..."
  docker ps | grep supermock-frontend || log "Контейнер supermock-frontend не найден в списке запущенных контейнеров."
  
  # Выводим логи контейнера
  log "Логи контейнера фронтенда:"
  docker logs --tail 20 supermock-frontend || log "Не удалось получить логи контейнера supermock-frontend."
  
else
  # Перезапускаем все контейнеры
  log "Перезапуск всех контейнеров..."
  
  # Сначала компилируем TypeScript для бэкенда
  log "Компиляция TypeScript для бэкенда..."
  cd backend && npm run build
  
  if [ $? -ne 0 ]; then
    error "Ошибка при компиляции TypeScript для бэкенда. Проверьте логи выше."
  fi
  
  log "Компиляция TypeScript для бэкенда успешно завершена."
  cd ..
  
  # Сборка фронтенда, если необходимо
  log "Сборка фронтенда..."
  cd react-frontend && npm run build
  
  if [ $? -ne 0 ]; then
    error "Ошибка при сборке фронтенда. Проверьте логи выше."
  fi
  
  log "Сборка фронтенда успешно завершена."
  cd ..
  
  # Останавливаем все контейнеры
  log "Останавливаем контейнеры..."
  docker-compose down
  
  # Запускаем все контейнеры
  log "Запускаем контейнеры..."
  docker-compose up -d
  
  # Проверяем статус контейнеров
  log "Проверка статуса контейнеров..."
  docker ps
  
  # Выводим логи контейнеров
  log "Логи контейнера бэкенда:"
  docker logs --tail 20 supermock-backend || log "Не удалось получить логи контейнера supermock-backend."
  
  log "Логи контейнера фронтенда:"
  docker logs --tail 20 supermock-frontend || log "Не удалось получить логи контейнера supermock-frontend."
fi

log "Перезапуск успешно завершен!"
log "Сайт должен быть доступен по адресу: http://localhost:9091"
log "API должен быть доступен по адресу: http://localhost:9092/api"