#!/bin/bash
set -e

# Параметры по умолчанию
VAULT_ADDR=${VAULT_ADDR:-"http://localhost:8200"}
VAULT_TOKEN=${VAULT_TOKEN:-"supermock-root-token"}
ENV_FILE=${ENV_FILE:-"../.env"}

# Функция для вывода сообщений
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Функция для проверки доступности Vault
check_vault() {
  log "Проверка доступности Vault по адресу $VAULT_ADDR..."
  if curl -s -f "$VAULT_ADDR/v1/sys/health" > /dev/null; then
    log "Vault доступен"
    return 0
  else
    log "Vault недоступен. Инициализация не будет выполнена."
    return 1
  fi
}

# Функция для инициализации Vault
init_vault() {
  log "Инициализация Vault..."
  
  # Проверяем, инициализирован ли уже Vault
  INIT_STATUS=$(curl -s "$VAULT_ADDR/v1/sys/health" | jq -r '.initialized')
  if [ "$INIT_STATUS" == "true" ]; then
    log "Vault уже инициализирован"
    return 0
  fi
  
  # Инициализируем Vault
  INIT_RESPONSE=$(curl -s -X PUT "$VAULT_ADDR/v1/sys/init" \
    -H "Content-Type: application/json" \
    -d '{"secret_shares": 1, "secret_threshold": 1}')
  
  # Сохраняем ключи
  ROOT_TOKEN=$(echo "$INIT_RESPONSE" | jq -r '.root_token')
  UNSEAL_KEY=$(echo "$INIT_RESPONSE" | jq -r '.keys_base64[0]')
  
  log "Root Token: $ROOT_TOKEN"
  log "Unseal Key: $UNSEAL_KEY"
  
  # Сохраняем ключи в файл (только для разработки!)
  echo "VAULT_TOKEN=$ROOT_TOKEN" > vault-keys.txt
  echo "VAULT_UNSEAL_KEY=$UNSEAL_KEY" >> vault-keys.txt
  
  log "Ключи сохранены в файл vault-keys.txt"
  
  # Распечатываем Vault
  curl -s -X PUT "$VAULT_ADDR/v1/sys/unseal" \
    -H "Content-Type: application/json" \
    -d "{\"key\": \"$UNSEAL_KEY\"}"
  
  log "Vault успешно распечатан"
  
  # Обновляем токен для дальнейшего использования
  VAULT_TOKEN=$ROOT_TOKEN
  
  return 0
}

# Функция для включения движка секретов KV версии 2
enable_kv_engine() {
  log "Включение движка секретов KV версии 2..."
  
  curl -s -X POST "$VAULT_ADDR/v1/sys/mounts/secret" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"type": "kv", "options": {"version": "2"}}' || {
      log "Движок секретов KV уже включен или произошла ошибка"
    }
  
  log "Движок секретов KV версии 2 включен"
}

# Функция для добавления секретов из .env файла
add_secrets_from_env() {
  log "Добавление секретов из файла $ENV_FILE..."
  
  if [ ! -f "$ENV_FILE" ]; then
    log "Файл $ENV_FILE не найден"
    return 1
  fi
  
  # Создаем временный JSON файл для секретов
  TEMP_FILE=$(mktemp)
  
  echo "{" > "$TEMP_FILE"
  
  # Читаем .env файл и добавляем секреты в JSON
  FIRST=true
  while IFS='=' read -r KEY VALUE || [ -n "$KEY" ]; do
    # Пропускаем пустые строки и комментарии
    if [ -z "$KEY" ] || [[ "$KEY" == \#* ]]; then
      continue
    fi
    
    # Удаляем пробелы и кавычки
    KEY=$(echo "$KEY" | tr -d ' ')
    VALUE=$(echo "$VALUE" | tr -d '"' | tr -d "'")
    
    # Добавляем запятую, если это не первый элемент
    if [ "$FIRST" = true ]; then
      FIRST=false
    else
      echo "," >> "$TEMP_FILE"
    fi
    
    # Добавляем секрет в JSON
    echo "  \"$KEY\": \"$VALUE\"" >> "$TEMP_FILE"
  done < "$ENV_FILE"
  
  echo "}" >> "$TEMP_FILE"
  
  # Добавляем секреты в Vault
  curl -s -X POST "$VAULT_ADDR/v1/secret/data/supermock" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"data\": $(cat "$TEMP_FILE")}"
  
  # Удаляем временный файл
  rm "$TEMP_FILE"
  
  log "Секреты успешно добавлены в Vault"
}

# Функция для включения движка секретов Kubernetes
enable_kubernetes_engine() {
  log "Включение движка секретов Kubernetes..."
  
  curl -s -X POST "$VAULT_ADDR/v1/sys/mounts/kubernetes" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"type": "kubernetes"}' || {
      log "Движок секретов Kubernetes уже включен или произошла ошибка"
    }
  
  log "Движок секретов Kubernetes включен"
}

# Функция для создания политики доступа
create_policy() {
  log "Создание политики доступа..."
  
  POLICY_NAME="supermock-policy"
  POLICY_HCL=$(cat <<EOF
# Разрешаем чтение секретов из пути secret/data/supermock
path "secret/data/supermock" {
  capabilities = ["read"]
}

# Разрешаем чтение секретов из пути kubernetes/supermock
path "kubernetes/supermock" {
  capabilities = ["read"]
}
EOF
)
  
  # Создаем временный файл для политики
  TEMP_FILE=$(mktemp)
  echo "$POLICY_HCL" > "$TEMP_FILE"
  
  # Создаем политику в Vault
  curl -s -X PUT "$VAULT_ADDR/v1/sys/policies/acl/$POLICY_NAME" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"policy\": $(jq -Rs . "$TEMP_FILE")}"
  
  # Удаляем временный файл
  rm "$TEMP_FILE"
  
  log "Политика доступа $POLICY_NAME успешно создана"
}

# Функция для создания роли для Kubernetes
create_kubernetes_role() {
  log "Создание роли для Kubernetes..."
  
  ROLE_NAME="supermock-role"
  
  curl -s -X POST "$VAULT_ADDR/v1/auth/kubernetes/role/$ROLE_NAME" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "bound_service_account_names": ["supermock-sa"],
      "bound_service_account_namespaces": ["supermock"],
      "policies": ["supermock-policy"],
      "ttl": "1h"
    }'
  
  log "Роль для Kubernetes $ROLE_NAME успешно создана"
}

# Основная логика скрипта
main() {
  log "Запуск скрипта инициализации Vault"
  
  # Проверяем наличие jq
  if ! command -v jq &> /dev/null; then
    log "jq не установлен. Установите jq с помощью команды:"
    log "  apt-get install jq"
    return 1
  fi
  
  # Проверяем доступность Vault
  if ! check_vault; then
    return 1
  fi
  
  # Инициализируем Vault
  init_vault
  
  # Включаем движок секретов KV версии 2
  enable_kv_engine
  
  # Добавляем секреты из .env файла
  add_secrets_from_env
  
  # Включаем движок секретов Kubernetes
  enable_kubernetes_engine
  
  # Создаем политику доступа
  create_policy
  
  # Создаем роль для Kubernetes
  create_kubernetes_role
  
  log "Скрипт инициализации Vault успешно завершен"
}

# Запускаем основную функцию
main "$@"