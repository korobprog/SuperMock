#!/bin/bash
set -e

# Функция для вывода сообщений
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Функция для проверки наличия Docker
check_docker() {
  if ! command -v docker &> /dev/null; then
    log "Docker не установлен. Установите Docker для запуска Vault."
    exit 1
  fi
}

# Функция для запуска Vault
start_vault() {
  log "Запуск Vault..."
  
  # Проверяем, запущен ли уже Vault
  if docker ps | grep -q "vault"; then
    log "Vault уже запущен"
    return 0
  fi
  
  # Запускаем Vault
  docker-compose up -d
  
  # Ждем, пока Vault запустится
  log "Ожидание запуска Vault..."
  sleep 5
  
  # Проверяем, запустился ли Vault
  if ! docker ps | grep -q "vault"; then
    log "Ошибка при запуске Vault"
    docker-compose logs
    return 1
  fi
  
  log "Vault успешно запущен"
  return 0
}

# Функция для инициализации Vault
init_vault() {
  log "Инициализация Vault..."
  
  # Проверяем, инициализирован ли уже Vault
  if [ -f "vault-keys.txt" ]; then
    log "Vault уже инициализирован (найден файл vault-keys.txt)"
    return 0
  fi
  
  # Запускаем скрипт инициализации
  bash ./init-vault.sh
  
  log "Vault успешно инициализирован"
  return 0
}

# Основная логика скрипта
main() {
  log "Запуск скрипта управления Vault"
  
  # Проверяем наличие Docker
  check_docker
  
  # Запускаем Vault
  if ! start_vault; then
    log "Ошибка при запуске Vault"
    exit 1
  fi
  
  # Инициализируем Vault
  if ! init_vault; then
    log "Ошибка при инициализации Vault"
    exit 1
  fi
  
  log "Vault успешно запущен и инициализирован"
  log "Доступ к UI: http://localhost:8200"
  log "Токен: $(grep VAULT_TOKEN vault-keys.txt | cut -d'=' -f2)"
}

# Запускаем основную функцию
main "$@"