#!/bin/bash
set -e

# Параметры по умолчанию
GRAFANA_URL=${GRAFANA_URL:-"http://localhost:3000"}
GRAFANA_USER=${GRAFANA_USER:-"admin"}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-"admin"}
DASHBOARD_FILE=${DASHBOARD_FILE:-"./grafana-dashboard.json"}

# Функция для вывода сообщений
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Функция для проверки доступности Grafana
check_grafana() {
  log "Проверка доступности Grafana по адресу $GRAFANA_URL..."
  if curl -s -f "$GRAFANA_URL/api/health" > /dev/null; then
    log "Grafana доступна"
    return 0
  else
    log "Grafana недоступна. Импорт дашборда не будет выполнен."
    return 1
  fi
}

# Функция для импорта дашборда
import_dashboard() {
  log "Импорт дашборда из файла $DASHBOARD_FILE..."
  
  # Создаем временный файл для импорта
  TEMP_FILE=$(mktemp)
  
  # Оборачиваем дашборд в формат для импорта
  jq '{dashboard: ., overwrite: true, folderId: 0}' "$DASHBOARD_FILE" > "$TEMP_FILE"
  
  # Импортируем дашборд
  RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/dashboards/db" -d @"$TEMP_FILE")
  
  # Удаляем временный файл
  rm "$TEMP_FILE"
  
  # Проверяем результат
  if echo "$RESPONSE" | jq -e '.url' > /dev/null; then
    DASHBOARD_URL="$GRAFANA_URL$(echo "$RESPONSE" | jq -r '.url')"
    log "Дашборд успешно импортирован"
    log "URL дашборда: $DASHBOARD_URL"
    return 0
  else
    log "Ошибка при импорте дашборда: $RESPONSE"
    return 1
  fi
}

# Основная логика скрипта
main() {
  log "Запуск скрипта импорта дашборда в Grafana"
  
  # Проверяем наличие jq
  if ! command -v jq &> /dev/null; then
    log "jq не установлен. Установите jq с помощью команды:"
    log "  apt-get install jq"
    return 1
  fi
  
  # Проверяем доступность Grafana
  if ! check_grafana; then
    return 1
  fi
  
  # Импортируем дашборд
  import_dashboard
  
  log "Скрипт импорта дашборда в Grafana завершен"
}

# Запускаем основную функцию
main "$@"