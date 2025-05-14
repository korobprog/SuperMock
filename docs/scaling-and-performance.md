# Руководство по масштабированию и производительности SuperMock

## Содержание

1. [Введение](#введение)
2. [Архитектура масштабирования](#архитектура-масштабирования)
3. [Горизонтальное масштабирование](#горизонтальное-масштабирование)
4. [Балансировка нагрузки](#балансировка-нагрузки)
5. [Кэширование](#кэширование)
6. [Оптимизация базы данных](#оптимизация-базы-данных)
7. [Мониторинг производительности](#мониторинг-производительности)
8. [Blue-Green Deployment](#blue-green-deployment)
9. [Дорожная карта улучшений](#дорожная-карта-улучшений)

## Введение

Данное руководство описывает стратегию масштабирования и оптимизации производительности системы SuperMock. Реализованные решения позволяют системе эффективно обрабатывать растущую нагрузку и обеспечивать высокую доступность сервиса.

## Архитектура масштабирования

Архитектура масштабирования SuperMock основана на следующих принципах:

- **Горизонтальное масштабирование**: Увеличение количества экземпляров сервиса для распределения нагрузки
- **Балансировка нагрузки**: Равномерное распределение запросов между экземплярами сервиса
- **Кэширование**: Снижение нагрузки на базу данных и ускорение ответов на запросы
- **Оптимизация базы данных**: Повышение производительности запросов к базе данных

## Горизонтальное масштабирование

### Kubernetes

Для горизонтального масштабирования используется Kubernetes, который обеспечивает:

- Автоматическое масштабирование на основе нагрузки (HPA)
- Управление ресурсами контейнеров
- Самовосстановление при сбоях
- Обновление без простоев (Rolling Updates)

### Настройка HPA (Horizontal Pod Autoscaler)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: supermock
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Docker Swarm (альтернатива)

Если Kubernetes недоступен, можно использовать Docker Swarm:

```bash
# Инициализация Docker Swarm
docker swarm init

# Развертывание стека
docker stack deploy -c docker-compose.yml supermock

# Масштабирование сервиса
docker service scale supermock_backend=3
```

## Балансировка нагрузки

### Nginx

Для балансировки нагрузки используется Nginx, который обеспечивает:

- Распределение запросов между экземплярами бэкенда
- Терминацию SSL
- Кэширование ответов
- Защиту от DDoS-атак

### Конфигурация балансировки нагрузки

```nginx
upstream backend {
  least_conn;
  server backend1:4000 max_fails=3 fail_timeout=30s;
  server backend2:4000 max_fails=3 fail_timeout=30s;
  server backend3:4000 max_fails=3 fail_timeout=30s;
  keepalive 32;
}
```

### Алгоритмы балансировки

- **least_conn**: Запросы направляются на сервер с наименьшим количеством активных соединений
- **ip_hash**: Запросы от одного IP всегда направляются на один и тот же сервер (для сохранения сессии)
- **round_robin**: Запросы распределяются последовательно между серверами (используется по умолчанию)

## Кэширование

### Redis

Redis используется для кэширования различных типов данных:

- Данные сессий пользователей
- Результаты частых API-запросов
- Временные данные для WebSocket соединений

### Оптимизация Redis

Для оптимизации Redis реализованы следующие настройки:

- Политика вытеснения данных: `allkeys-lru`
- Ограничение использования памяти: `maxmemory 800mb`
- Настройка TTL для разных типов кэшей:
  - API-кэш: 5 минут
  - Сессии: 30 минут
  - Статические данные: 1 час

### Nginx кэширование

Nginx также используется для кэширования статических ресурсов и API-ответов:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=supermock_cache:10m max_size=1g inactive=60m;
proxy_cache_key "$scheme$request_method$host$request_uri";
proxy_cache_valid 200 302 10m;
proxy_cache_valid 404 1m;
```

## Оптимизация базы данных

### MongoDB

Для оптимизации MongoDB реализованы следующие меры:

- Индексы для часто запрашиваемых полей
- Оптимизация запросов
- Настройка WiredTiger кэша
- Репликация для отказоустойчивости

### Индексы MongoDB

```javascript
// Индексы для коллекции пользователей
db.collection('users').createIndex({ email: 1 }, { unique: true });
db.collection('users').createIndex({ googleId: 1 }, { sparse: true });
db.collection('users').createIndex({ createdAt: 1 });

// Индексы для коллекции сессий
db.collection('sessions').createIndex({ userId: 1 });
db.collection('sessions').createIndex({ createdAt: 1 });
db.collection('sessions').createIndex({ status: 1 });
```

### Репликация MongoDB

Для обеспечения высокой доступности и отказоустойчивости настроена репликация MongoDB:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mongodb
  template:
    spec:
      containers:
        - name: mongodb
          args:
            - '--replSet'
            - 'rs0'
            - '--wiredTigerCacheSizeGB'
            - '1'
```

## Мониторинг производительности

### Prometheus и Grafana

Для мониторинга производительности используются:

- **Prometheus**: Сбор метрик
- **Grafana**: Визуализация метрик
- **Node Exporter**: Метрики сервера
- **MongoDB Exporter**: Метрики MongoDB
- **Redis Exporter**: Метрики Redis

### Ключевые метрики

- CPU и память контейнеров
- Время ответа API
- Количество запросов в секунду
- Количество активных WebSocket соединений
- Использование кэша Redis
- Операции чтения/записи в MongoDB

## Blue-Green Deployment

Blue-Green Deployment - это стратегия развертывания, которая позволяет обновлять приложения с нулевым временем простоя и минимальным риском. В SuperMock реализована полноценная поддержка Blue-Green Deployment с использованием Kubernetes.

### Архитектура Blue-Green Deployment

Архитектура Blue-Green Deployment включает:

- Два идентичных окружения (blue и green)
- Service для маршрутизации трафика между окружениями
- ConfigMap для конфигурации Blue-Green Deployment
- Скрипты для управления процессом развертывания

### Компоненты Blue-Green Deployment

```
kubernetes/blue-green/
├── backend-blue.yaml     # Deployment для blue версии
├── backend-green.yaml    # Deployment для green версии
├── service.yaml          # Service для маршрутизации трафика
├── configmap.yaml        # ConfigMap с настройками
├── kustomization.yaml    # Kustomize конфигурация
├── switch-version.sh     # Скрипт для переключения версий
├── deploy-blue-green.sh  # Скрипт для развертывания
└── README.md             # Документация
```

### Процесс развертывания

1. Развертывание blue и green версий:

   ```bash
   ./kubernetes/deploy.sh blue-green prod blue
   ```

2. Переключение между версиями:

   ```bash
   ./kubernetes/deploy.sh switch prod green
   ```

3. Постепенное переключение (canary):
   ```bash
   ./kubernetes/deploy.sh switch prod green 20
   ```

### Автоматический откат

Система поддерживает автоматический откат при обнаружении проблем с новой версией:

- Мониторинг ошибок и задержек после переключения
- Автоматический откат при превышении пороговых значений
- Настраиваемые параметры мониторинга и отката

### Интеграция с CI/CD

Blue-Green Deployment интегрирован с CI/CD пайплайном:

1. Сборка и публикация Docker образа с тегом `blue` или `green`
2. Обновление неактивного Deployment
3. Тестирование новой версии через preview сервис
4. Переключение трафика на новую версию

## Дорожная карта улучшений

### Краткосрочные улучшения (1-2 недели)

- [x] Удалить жестко закодированные секреты из docker-compose.yml
- [x] Обновить Dockerfile с использованием непривилегированного пользователя
- [x] Ограничить доступ к MongoDB и Redis только из внутренней сети
- [x] Создать шаблоны .env файлов с документацией

### Среднесрочные улучшения (1-2 месяца)

- [x] Внедрить CI/CD пайплайн с GitHub Actions
- [x] Настроить централизованное логирование
- [x] Реализовать multi-stage сборку в Dockerfile
- [x] Настроить регулярное резервное копирование данных
- [ ] Внедрить автоматическое тестирование производительности

### Долгосрочные улучшения (3+ месяцев)

- [x] Внедрить Kubernetes для оркестрации контейнеров
- [x] Настроить мониторинг с Prometheus и Grafana
- [ ] Внедрить HashiCorp Vault для управления секретами
- [x] Реализовать blue-green deployment или canary releases
- [ ] Внедрить сервисную сетку (Service Mesh) для улучшенного управления трафиком
