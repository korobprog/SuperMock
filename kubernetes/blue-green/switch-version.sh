#!/bin/bash

# Скрипт для управления blue-green deployment
# Использование: ./switch-version.sh [blue|green] [--canary=percentage]

set -e

# Проверка наличия kubectl
if ! command -v kubectl &> /dev/null; then
    echo "Ошибка: kubectl не установлен"
    exit 1
fi

# Проверка наличия jq для работы с JSON
if ! command -v jq &> /dev/null; then
    echo "Ошибка: jq не установлен. Установите с помощью 'apt-get install jq' или 'brew install jq'"
    exit 1
fi

# Константы
NAMESPACE="supermock"
SERVICE_NAME="backend-service"
CONFIG_MAP_NAME="blue-green-config"
BLUE_DEPLOYMENT="backend-blue"
GREEN_DEPLOYMENT="backend-green"

# Получение текущей активной версии
get_active_version() {
    kubectl get configmap $CONFIG_MAP_NAME -n $NAMESPACE -o jsonpath='{.data.ACTIVE_VERSION}'
}

# Проверка готовности deployment
check_deployment_ready() {
    local deployment=$1
    local ready=$(kubectl get deployment $deployment -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')
    local desired=$(kubectl get deployment $deployment -n $NAMESPACE -o jsonpath='{.spec.replicas}')
    
    if [ "$ready" == "$desired" ]; then
        return 0
    else
        return 1
    fi
}

# Проверка здоровья сервиса
check_health() {
    local version=$1
    local selector="app=backend,version=$version"
    local pod=$(kubectl get pods -n $NAMESPACE -l $selector -o jsonpath='{.items[0].metadata.name}')
    local health_path=$(kubectl get configmap $CONFIG_MAP_NAME -n $NAMESPACE -o jsonpath='{.data.HEALTH_CHECK_PATH}')
    local timeout=$(kubectl get configmap $CONFIG_MAP_NAME -n $NAMESPACE -o jsonpath='{.data.HEALTH_CHECK_TIMEOUT_SECONDS}')
    local interval=$(kubectl get configmap $CONFIG_MAP_NAME -n $NAMESPACE -o jsonpath='{.data.HEALTH_CHECK_INTERVAL_SECONDS}')
    local required_success=$(kubectl get configmap $CONFIG_MAP_NAME -n $NAMESPACE -o jsonpath='{.data.REQUIRED_SUCCESS_COUNT}')
    
    echo "Проверка здоровья $version версии..."
    
    local success_count=0
    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))
    
    while [ $(date +%s) -lt $end_time ]; do
        if kubectl exec $pod -n $NAMESPACE -- curl -s -o /dev/null -w "%{http_code}" localhost:4000$health_path | grep -q "200"; then
            success_count=$((success_count + 1))
            echo "Успешная проверка здоровья ($success_count/$required_success)"
            
            if [ $success_count -ge $required_success ]; then
                echo "Версия $version здорова!"
                return 0
            fi
        else
            echo "Ошибка проверки здоровья"
            success_count=0
        fi
        
        sleep $interval
    done
    
    echo "Превышено время ожидания для проверки здоровья версии $version"
    return 1
}

# Переключение на новую версию
switch_to_version() {
    local new_version=$1
    local current_version=$(get_active_version)
    
    if [ "$new_version" == "$current_version" ]; then
        echo "Версия $new_version уже активна"
        return 0
    fi
    
    echo "Переключение с $current_version на $new_version..."
    
    # Проверка готовности новой версии
    if ! check_deployment_ready "backend-$new_version"; then
        echo "Ошибка: Deployment backend-$new_version не готов"
        exit 1
    fi
    
    # Проверка здоровья новой версии
    if ! check_health $new_version; then
        echo "Ошибка: Версия $new_version не прошла проверку здоровья"
        exit 1
    fi
    
    # Обновление селектора сервиса
    kubectl patch service $SERVICE_NAME -n $NAMESPACE --type='json' -p="[{'op': 'replace', 'path': '/spec/selector/version', 'value': '$new_version'}]"
    
    # Обновление ConfigMap
    kubectl patch configmap $CONFIG_MAP_NAME -n $NAMESPACE --type='json' -p="[{'op': 'replace', 'path': '/data/ACTIVE_VERSION', 'value': '$new_version'}]"
    
    echo "Успешно переключено на версию $new_version"
    
    # Запуск мониторинга для автоматического отката
    monitor_for_rollback $new_version $current_version &
}

# Мониторинг для автоматического отката
monitor_for_rollback() {
    local new_version=$1
    local previous_version=$2
    local rollback_timeout=$(kubectl get configmap $CONFIG_MAP_NAME -n $NAMESPACE -o jsonpath='{.data.ROLLBACK_TIMEOUT_SECONDS}')
    local error_threshold=$(kubectl get configmap $CONFIG_MAP_NAME -n $NAMESPACE -o jsonpath='{.data.ERROR_THRESHOLD_PERCENTAGE}')
    local latency_threshold=$(kubectl get configmap $CONFIG_MAP_NAME -n $NAMESPACE -o jsonpath='{.data.LATENCY_THRESHOLD_MS}')
    
    echo "Мониторинг новой версии $new_version в течение $rollback_timeout секунд..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + rollback_timeout))
    
    while [ $(date +%s) -lt $end_time ]; do
        # Получение метрик из Prometheus (пример, нужно адаптировать под вашу конфигурацию)
        local error_rate=$(curl -s "http://prometheus:9090/api/v1/query?query=sum(rate(http_requests_total{status=~\"5..\",app=\"backend\",version=\"$new_version\"}[1m]))/sum(rate(http_requests_total{app=\"backend\",version=\"$new_version\"}[1m]))*100" | jq '.data.result[0].value[1]')
        local latency=$(curl -s "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket{app=\"backend\",version=\"$new_version\"}[1m]))by(le))*1000" | jq '.data.result[0].value[1]')
        
        if (( $(echo "$error_rate > $error_threshold" | bc -l) )) || (( $(echo "$latency > $latency_threshold" | bc -l) )); then
            echo "Обнаружены проблемы с новой версией $new_version. Ошибки: $error_rate%, Задержка: ${latency}ms"
            echo "Выполняется автоматический откат на версию $previous_version..."
            
            # Откат на предыдущую версию
            kubectl patch service $SERVICE_NAME -n $NAMESPACE --type='json' -p="[{'op': 'replace', 'path': '/spec/selector/version', 'value': '$previous_version'}]"
            kubectl patch configmap $CONFIG_MAP_NAME -n $NAMESPACE --type='json' -p="[{'op': 'replace', 'path': '/data/ACTIVE_VERSION', 'value': '$previous_version'}]"
            
            echo "Выполнен откат на версию $previous_version"
            return
        fi
        
        sleep 10
    done
    
    echo "Мониторинг завершен. Версия $new_version стабильна."
}

# Постепенное переключение (canary)
canary_deployment() {
    local target_version=$1
    local percentage=$2
    local current_version=$(get_active_version)
    
    if [ "$target_version" == "$current_version" ]; then
        echo "Версия $target_version уже активна"
        return 0
    fi
    
    echo "Начало canary deployment: $percentage% трафика на $target_version..."
    
    # Проверка готовности целевой версии
    if ! check_deployment_ready "backend-$target_version"; then
        echo "Ошибка: Deployment backend-$target_version не готов"
        exit 1
    fi
    
    # Проверка здоровья целевой версии
    if ! check_health $target_version; then
        echo "Ошибка: Версия $target_version не прошла проверку здоровья"
        exit 1
    fi
    
    # Обновление ConfigMap для canary deployment
    kubectl patch configmap $CONFIG_MAP_NAME -n $NAMESPACE --type='json' -p="[
        {'op': 'replace', 'path': '/data/ENABLE_CANARY', 'value': 'true'},
        {'op': 'replace', 'path': '/data/CANARY_PERCENTAGE', 'value': '$percentage'}
    ]"
    
    # Здесь должна быть логика для настройки Istio или другого сервисного меша
    # для разделения трафика между версиями
    # Пример для Istio:
    # kubectl apply -f - <<EOF
    # apiVersion: networking.istio.io/v1alpha3
    # kind: VirtualService
    # metadata:
    #   name: backend-vs
    #   namespace: $NAMESPACE
    # spec:
    #   hosts:
    #   - backend-service
    #   http:
    #   - route:
    #     - destination:
    #         host: backend-service
    #         subset: $current_version
    #       weight: $((100 - percentage))
    #     - destination:
    #         host: backend-service
    #         subset: $target_version
    #       weight: $percentage
    # EOF
    
    echo "Canary deployment настроен: $percentage% трафика направлено на $target_version"
}

# Основная логика
main() {
    local target_version=""
    local canary_percentage=0
    
    # Парсинг аргументов
    for arg in "$@"; do
        case $arg in
            blue|green)
                target_version=$arg
                ;;
            --canary=*)
                canary_percentage="${arg#*=}"
                ;;
            *)
                echo "Неизвестный аргумент: $arg"
                exit 1
                ;;
        esac
    done
    
    # Проверка аргументов
    if [ -z "$target_version" ]; then
        echo "Ошибка: Не указана целевая версия (blue или green)"
        echo "Использование: $0 [blue|green] [--canary=percentage]"
        exit 1
    fi
    
    # Выполнение операции
    if [ $canary_percentage -gt 0 ]; then
        canary_deployment $target_version $canary_percentage
    else
        switch_to_version $target_version
    fi
}

# Запуск скрипта
main "$@"