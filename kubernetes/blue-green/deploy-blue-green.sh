#!/bin/bash

# Скрипт для развертывания blue-green конфигурации
# Использование: ./deploy-blue-green.sh [--initial-version=blue|green]

set -e

# Проверка наличия kubectl
if ! command -v kubectl &> /dev/null; then
    echo "Ошибка: kubectl не установлен"
    exit 1
fi

# Константы
NAMESPACE="supermock"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INITIAL_VERSION="blue"  # По умолчанию начинаем с blue версии

# Парсинг аргументов
for arg in "$@"; do
    case $arg in
        --initial-version=*)
        INITIAL_VERSION="${arg#*=}"
        if [[ "$INITIAL_VERSION" != "blue" && "$INITIAL_VERSION" != "green" ]]; then
            echo "Ошибка: Начальная версия должна быть 'blue' или 'green'"
            exit 1
        fi
        shift
        ;;
    esac
done

# Функция для проверки существования namespace
check_namespace() {
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        echo "Создание namespace $NAMESPACE..."
        kubectl create namespace $NAMESPACE
    else
        echo "Namespace $NAMESPACE уже существует"
    fi
}

# Функция для настройки прав доступа
setup_permissions() {
    echo "Настройка прав доступа для blue-green deployment..."
    
    # Проверка существования ServiceAccount
    if ! kubectl get serviceaccount supermock-sa -n $NAMESPACE &> /dev/null; then
        echo "Создание ServiceAccount supermock-sa..."
        kubectl create serviceaccount supermock-sa -n $NAMESPACE
    fi
    
    # Создание или обновление ClusterRole
    kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: supermock-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "watch", "patch", "update"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "patch", "update"]
EOF
    
    # Создание или обновление ClusterRoleBinding
    kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: supermock-rolebinding
subjects:
- kind: ServiceAccount
  name: supermock-sa
  namespace: $NAMESPACE
roleRef:
  kind: ClusterRole
  name: supermock-role
  apiGroup: rbac.authorization.k8s.io
EOF
    
    echo "Права доступа настроены"
}

# Функция для создания секретов для доступа к Docker registry
setup_docker_registry_secret() {
    echo "Настройка секрета для доступа к Docker registry..."
    
    # Проверка наличия переменных окружения
    if [[ -z "${DOCKER_USERNAME}" || -z "${DOCKER_PASSWORD}" ]]; then
        echo "Ошибка: Переменные окружения DOCKER_USERNAME и DOCKER_PASSWORD должны быть установлены"
        echo "Пример: export DOCKER_USERNAME=myuser && export DOCKER_PASSWORD=mypassword"
        exit 1
    fi
    
    # Создание или обновление секрета
    kubectl create secret docker-registry docker-registry-secret \
        --docker-server=https://index.docker.io/v1/ \
        --docker-username=$DOCKER_USERNAME \
        --docker-password=$DOCKER_PASSWORD \
        --docker-email=$DOCKER_USERNAME@example.com \
        -n $NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    echo "Секрет docker-registry-secret создан/обновлен"
}

# Функция для применения kustomize конфигурации
apply_kustomize() {
    echo "Применение kustomize конфигурации..."
    
    # Применение конфигурации с помощью kustomize
    kubectl apply -k $SCRIPT_DIR
    
    echo "Kustomize конфигурация применена"
}

# Функция для настройки начальной версии
setup_initial_version() {
    echo "Настройка начальной версии: $INITIAL_VERSION..."
    
    # Обновление ConfigMap с начальной версией
    kubectl patch configmap blue-green-config -n $NAMESPACE --type='json' -p="[{'op': 'replace', 'path': '/data/ACTIVE_VERSION', 'value': '$INITIAL_VERSION'}]"
    
    # Обновление селектора сервиса
    kubectl patch service backend-service -n $NAMESPACE --type='json' -p="[{'op': 'replace', 'path': '/spec/selector/version', 'value': '$INITIAL_VERSION'}]"
    
    echo "Начальная версия $INITIAL_VERSION настроена"
}

# Функция для проверки статуса развертывания
check_deployment_status() {
    echo "Проверка статуса развертывания..."
    
    # Проверка статуса blue deployment
    echo "Статус blue deployment:"
    kubectl rollout status deployment/backend-blue -n $NAMESPACE
    
    # Проверка статуса green deployment
    echo "Статус green deployment:"
    kubectl rollout status deployment/backend-green -n $NAMESPACE
    
    # Проверка сервисов
    echo "Статус сервисов:"
    kubectl get services -n $NAMESPACE -l app=backend
    
    # Проверка подов
    echo "Статус подов:"
    kubectl get pods -n $NAMESPACE -l app=backend
    
    echo "Проверка завершена"
}

# Функция для настройки прав на скрипт переключения версий
setup_switch_script() {
    echo "Настройка прав на скрипт переключения версий..."
    
    # Установка прав на выполнение
    chmod +x $SCRIPT_DIR/switch-version.sh
    
    echo "Права на скрипт переключения версий настроены"
}

# Основная логика
main() {
    echo "Начало развертывания blue-green конфигурации..."
    
    # Проверка namespace
    check_namespace
    
    # Настройка прав доступа
    setup_permissions
    
    # Настройка секрета для Docker registry
    setup_docker_registry_secret
    
    # Применение kustomize конфигурации
    apply_kustomize
    
    # Настройка начальной версии
    setup_initial_version
    
    # Настройка прав на скрипт переключения версий
    setup_switch_script
    
    # Проверка статуса развертывания
    check_deployment_status
    
    echo "Развертывание blue-green конфигурации завершено успешно!"
    echo ""
    echo "Для переключения между версиями используйте скрипт switch-version.sh:"
    echo "  ./switch-version.sh blue                # Переключение на blue версию"
    echo "  ./switch-version.sh green               # Переключение на green версию"
    echo "  ./switch-version.sh green --canary=20   # Постепенное переключение на green версию (20% трафика)"
}

# Запуск скрипта
main