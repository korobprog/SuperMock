#!/bin/bash

# Скрипт для развертывания Kubernetes кластера
# Поддерживает стандартное развертывание и blue-green deployment

set -e

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

# Проверка наличия необходимых инструментов
check_dependencies() {
  log "Проверка зависимостей..."
  
  if ! command -v kubectl &> /dev/null; then
    error "kubectl не установлен. Установите kubectl и повторите попытку."
  fi
  
  if ! command -v kustomize &> /dev/null; then
    error "kustomize не установлен. Установите kustomize и повторите попытку."
  fi
  
  log "Все зависимости установлены."
}

# Функция для проверки наличия переменных окружения
check_env_vars() {
  log "Проверка переменных окружения..."
  
  required_vars=(
    "DOCKER_USERNAME"
    "JWT_SECRET_BASE64"
    "MONGO_USERNAME_BASE64"
    "MONGO_PASSWORD_BASE64"
    "REDIS_PASSWORD_BASE64"
    "GOOGLE_CLIENT_ID_BASE64"
    "GOOGLE_CLIENT_SECRET_BASE64"
    "GOOGLE_CALLBACK_URL_BASE64"
    "FRONTEND_URL_BASE64"
  )
  
  missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      missing_vars+=("$var")
    fi
  done
  
  if [ ${#missing_vars[@]} -ne 0 ]; then
    error "Отсутствуют следующие переменные окружения: ${missing_vars[*]}"
  fi
  
  log "Все необходимые переменные окружения установлены."
}

# Функция для развертывания в указанном окружении
deploy() {
  local env=$1
  
  if [ "$env" != "dev" ] && [ "$env" != "prod" ]; then
    error "Неверное окружение. Используйте 'dev' или 'prod'."
  fi
  
  log "Начинаем развертывание в окружении '$env'..."
  
  # Создаем namespace, если он не существует
  if [ "$env" == "dev" ]; then
    kubectl create namespace supermock-dev --dry-run=client -o yaml | kubectl apply -f -
  else
    kubectl create namespace supermock-prod --dry-run=client -o yaml | kubectl apply -f -
  fi
  
  # Применяем конфигурацию с помощью kustomize
  log "Применяем конфигурацию Kubernetes..."
  kustomize build kubernetes/overlays/$env | envsubst | kubectl apply -f -
  
  log "Проверяем статус развертывания..."
  kubectl -n supermock-$env get pods
  
  log "Развертывание в окружении '$env' успешно завершено."
}

# Функция для отката развертывания
rollback() {
  local env=$1
  
  if [ "$env" != "dev" ] && [ "$env" != "prod" ]; then
    error "Неверное окружение. Используйте 'dev' или 'prod'."
  fi
  
  log "Начинаем откат развертывания в окружении '$env'..."
  
  # Удаляем все ресурсы, созданные kustomize
  kustomize build kubernetes/overlays/$env | envsubst | kubectl delete -f -
  
  log "Откат в окружении '$env' успешно завершен."
}

# Функция для развертывания blue-green конфигурации
deploy_blue_green() {
  local env=$1
  local initial_version=$2
  
  if [ "$env" != "dev" ] && [ "$env" != "prod" ]; then
    error "Неверное окружение. Используйте 'dev' или 'prod'."
  fi
  
  if [ -z "$initial_version" ]; then
    initial_version="blue"
  elif [ "$initial_version" != "blue" ] && [ "$initial_version" != "green" ]; then
    error "Неверная начальная версия. Используйте 'blue' или 'green'."
  fi
  
  log "Начинаем развертывание blue-green в окружении '$env' с начальной версией '$initial_version'..."
  
  # Создаем namespace, если он не существует
  if [ "$env" == "dev" ]; then
    kubectl create namespace supermock-dev --dry-run=client -o yaml | kubectl apply -f -
  else
    kubectl create namespace supermock-prod --dry-run=client -o yaml | kubectl apply -f -
  fi
  
  # Запускаем скрипт развертывания blue-green
  log "Запускаем скрипт развертывания blue-green..."
  
  # Устанавливаем права на выполнение
  chmod +x kubernetes/blue-green/deploy-blue-green.sh
  
  # Запускаем скрипт с передачей переменных окружения
  NAMESPACE="supermock-$env" \
  kubernetes/blue-green/deploy-blue-green.sh --initial-version=$initial_version
  
  log "Blue-Green развертывание в окружении '$env' успешно завершено."
}

# Функция для переключения версий в blue-green deployment
switch_version() {
  local env=$1
  local target_version=$2
  local canary_percentage=$3
  
  if [ "$env" != "dev" ] && [ "$env" != "prod" ]; then
    error "Неверное окружение. Используйте 'dev' или 'prod'."
  fi
  
  if [ "$target_version" != "blue" ] && [ "$target_version" != "green" ]; then
    error "Неверная целевая версия. Используйте 'blue' или 'green'."
  fi
  
  log "Переключение на версию '$target_version' в окружении '$env'..."
  
  # Устанавливаем права на выполнение
  chmod +x kubernetes/blue-green/switch-version.sh
  
  # Формируем команду
  local cmd="kubernetes/blue-green/switch-version.sh $target_version"
  
  # Добавляем параметр canary, если он указан
  if [ -n "$canary_percentage" ]; then
    cmd="$cmd --canary=$canary_percentage"
  fi
  
  # Запускаем скрипт с передачей переменных окружения
  NAMESPACE="supermock-$env" \
  $cmd
  
  log "Переключение на версию '$target_version' в окружении '$env' успешно завершено."
}

# Основная логика скрипта
main() {
  local command=$1
  local env=$2
  local param1=$3
  local param2=$4
  
  check_dependencies
  
  case $command in
    deploy)
      check_env_vars
      deploy "$env"
      ;;
    rollback)
      rollback "$env"
      ;;
    blue-green)
      check_env_vars
      deploy_blue_green "$env" "$param1"
      ;;
    switch)
      switch_version "$env" "$param1" "$param2"
      ;;
    *)
      echo "Использование:"
      echo "  $0 deploy [dev|prod]                      # Стандартное развертывание"
      echo "  $0 rollback [dev|prod]                    # Откат стандартного развертывания"
      echo "  $0 blue-green [dev|prod] [blue|green]     # Blue-Green развертывание"
      echo "  $0 switch [dev|prod] [blue|green] [canary] # Переключение версий в Blue-Green"
      exit 1
      ;;
  esac
}

# Запуск скрипта
main "$@"