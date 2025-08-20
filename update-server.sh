#!/bin/bash

echo "Обновление сервера Super Mock..."

# Подключение к серверу и обновление
ssh root@217.198.6.238 << 'EOF'

echo "Останавливаем контейнеры..."
cd /opt/mockmate
docker-compose -f docker-compose.prod.yml -f docker-compose.override.yml down

echo "Обновляем конфигурацию Traefik..."
cat > /opt/mockmate/traefik/traefik.yml << 'TRAEFIK_CONFIG'
# Основная конфигурация Traefik для Super Mock (исправленная версия)
api:
  dashboard: true
  insecure: true

# Логирование
log:
  level: INFO
  format: json

# Доступ к Docker
providers:
  docker:
    endpoint: 'unix:///var/run/docker.sock'
    exposedByDefault: false
    network: mockmate_mockmate-network

# Точки входа
entryPoints:
  web:
    address: ':80'
  websecure:
    address: ':443'

# Сертификаты
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@supermock.ru
      storage: /acme/acme.json
      httpChallenge:
        entryPoint: web

# Настройки безопасности
serversTransport:
  insecureSkipVerify: true

# Настройки TLS
tls:
  options:
    default:
      minVersion: 'VersionTLS12'
      cipherSuites:
        - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
        - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
        - TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305
        - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305

# Настройки HTTP
http:
  middlewares:
    # Заголовки безопасности
    security-headers:
      headers:
        browserXssFilter: true
        contentTypeNosniff: true
        forceSTSHeader: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 31536000
        customFrameOptionsValue: 'SAMEORIGIN'
        customResponseHeaders:
          X-Robots-Tag: 'none,noarchive,nosnippet,notranslate,noimageindex'
          Server: ''

    # Заголовки для прокси
    proxy-headers:
      headers:
        customRequestHeaders:
          X-Forwarded-Proto: 'https'
          X-Real-IP: '127.0.0.1'
          X-Forwarded-For: '127.0.0.1'
          X-Forwarded-Host: 'localhost'

    # WebSocket поддержка
    websocket-headers:
      headers:
        customRequestHeaders:
          Upgrade: 'websocket'
          Connection: 'upgrade'

    # Rate limiting
    rate-limit:
      rateLimit:
        burst: 100
        average: 50

# Настройки глобальные
global:
  checkNewVersion: false
  sendAnonymousUsage: false
TRAEFIK_CONFIG

echo "Перезапускаем Traefik..."
cd /opt/mockmate/traefik
docker-compose down
docker-compose up -d

echo "Пересобираем и запускаем приложение..."
cd /opt/mockmate
docker-compose -f docker-compose.prod.yml -f docker-compose.override.yml build --no-cache
docker-compose -f docker-compose.prod.yml -f docker-compose.override.yml up -d

echo "Проверяем статус контейнеров..."
docker ps | grep mockmate

echo "Проверяем логи Traefik..."
docker logs traefik 2>&1 | tail -10

echo "Обновление завершено!"
EOF

echo "Скрипт обновления выполнен!"
