#!/bin/bash
set -e

# Параметры по умолчанию
API_URL=${API_URL:-"http://localhost:4000"}
TEST_USER_EMAIL=${TEST_USER_EMAIL:-"test@example.com"}
TEST_USER_PASSWORD=${TEST_USER_PASSWORD:-"password123"}
OUTPUT_DIR=${OUTPUT_DIR:-"./results"}
TEST_SCRIPT=${TEST_SCRIPT:-"./api-load-test.js"}
K6_PROMETHEUS_RW_SERVER_URL=${K6_PROMETHEUS_RW_SERVER_URL:-"http://localhost:9090/api/v1/write"}

# Создаем директорию для результатов, если она не существует
mkdir -p "$OUTPUT_DIR"

# Функция для вывода сообщений
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Функция для проверки доступности API
check_api() {
  log "Проверка доступности API по адресу $API_URL/health..."
  if curl -s -f "$API_URL/health" > /dev/null; then
    log "API доступен"
    return 0
  else
    log "API недоступен. Тесты не будут запущены."
    return 1
  fi
}

# Функция для запуска тестов производительности
run_tests() {
  log "Запуск тестов производительности..."
  
  # Экспортируем переменные окружения для k6
  export API_URL
  export TEST_USER_EMAIL
  export TEST_USER_PASSWORD
  
  # Запускаем k6 с выводом в JSON и Prometheus
  k6 run \
    --out json="$OUTPUT_DIR/results.json" \
    --out prometheus-remote="$K6_PROMETHEUS_RW_SERVER_URL" \
    "$TEST_SCRIPT"
  
  local exit_code=$?
  if [ $exit_code -eq 0 ]; then
    log "Тесты производительности успешно завершены"
  else
    log "Тесты производительности завершились с ошибками (код $exit_code)"
  fi
  
  return $exit_code
}

# Функция для анализа результатов
analyze_results() {
  log "Анализ результатов тестов..."
  
  # Проверяем наличие файла с результатами
  if [ ! -f "$OUTPUT_DIR/results.json" ]; then
    log "Файл с результатами не найден"
    return 1
  fi
  
  # Извлекаем ключевые метрики из результатов
  local avg_response_time=$(jq '.metrics.http_req_duration.avg' "$OUTPUT_DIR/results.json")
  local p95_response_time=$(jq '.metrics.http_req_duration.p95' "$OUTPUT_DIR/results.json")
  local error_rate=$(jq '.metrics.errors.rate' "$OUTPUT_DIR/results.json")
  
  log "Средняя время ответа: ${avg_response_time}ms"
  log "95-й процентиль времени ответа: ${p95_response_time}ms"
  log "Уровень ошибок: ${error_rate}%"
  
  # Создаем отчет в формате Markdown
  cat > "$OUTPUT_DIR/report.md" << EOF
# Отчет о тестировании производительности

## Общая информация

- **Дата запуска:** $(date +'%Y-%m-%d %H:%M:%S')
- **API URL:** $API_URL
- **Скрипт тестирования:** $TEST_SCRIPT

## Ключевые метрики

- **Средняя время ответа:** ${avg_response_time}ms
- **95-й процентиль времени ответа:** ${p95_response_time}ms
- **Уровень ошибок:** ${error_rate}%

## Рекомендации

$(if (( $(echo "$p95_response_time > 500" | bc -l) )); then
  echo "- ⚠️ 95-й процентиль времени ответа превышает рекомендуемое значение (500ms)"
  echo "  - Рекомендуется оптимизировать запросы к базе данных"
  echo "  - Рассмотреть возможность кэширования часто запрашиваемых данных"
fi)

$(if (( $(echo "$error_rate > 0.1" | bc -l) )); then
  echo "- ⚠️ Уровень ошибок превышает допустимое значение (0.1%)"
  echo "  - Необходимо проанализировать логи для выявления причин ошибок"
  echo "  - Проверить обработку исключений в коде"
fi)

## Графики

Графики доступны в Grafana по адресу: http://localhost:3000/d/k6-performance/k6-performance-results

EOF
  
  log "Отчет сохранен в $OUTPUT_DIR/report.md"
}

# Основная логика скрипта
main() {
  log "Запуск скрипта тестирования производительности"
  
  # Проверяем наличие k6
  if ! command -v k6 &> /dev/null; then
    log "k6 не установлен. Установите k6 с помощью команды:"
    log "  docker pull grafana/k6"
    return 1
  fi
  
  # Проверяем наличие jq
  if ! command -v jq &> /dev/null; then
    log "jq не установлен. Установите jq с помощью команды:"
    log "  apt-get install jq"
    return 1
  fi
  
  # Проверяем доступность API
  if ! check_api; then
    return 1
  fi
  
  # Запускаем тесты
  if run_tests; then
    # Анализируем результаты
    analyze_results
  fi
  
  log "Скрипт тестирования производительности завершен"
}

# Запускаем основную функцию
main "$@"