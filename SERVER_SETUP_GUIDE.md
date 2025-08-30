# 🚀 РУКОВОДСТВО ПО НАСТРОЙКЕ СЕРВЕРА ДЛЯ TEST.SUPERMOCK.RU

## 📋 **ПРЕДВАРИТЕЛЬНЫЕ ТРЕБОВАНИЯ**

### 🔧 **На сервере должны быть установлены:**
```bash
# Docker и Docker Compose
sudo apt update
sudo apt install docker.io docker-compose-plugin

# Nginx
sudo apt install nginx

# Certbot для SSL
sudo apt install certbot python3-certbot-nginx
```

---

## �� **ШАГ 1: НАСТРОЙКА DNS**

### 📝 **В панели управления доменом:**
1. Добавить A-запись:
   ```
   test.supermock.ru → [IP_ВАШЕГО_СЕРВЕРА]
   ```
2. Подождать 5-15 минут для распространения DNS

### 🔍 **Проверка DNS:**
```bash
nslookup test.supermock.ru
dig test.supermock.ru
```

---

## 📁 **ШАГ 2: ПОДГОТОВКА СЕРВЕРА**

### 📂 **Создание рабочей директории:**
```bash
# Подключиться к серверу
ssh user@your-server-ip

# Создать директорию
sudo mkdir -p /opt/testsupermock
sudo chown $USER:$USER /opt/testsupermock
cd /opt/testsupermock
```

### 📦 **Копирование файлов:**
```bash
# Скопировать проект на сервер (из локальной машины)
scp -r /path/to/supermock/* user@your-server-ip:/opt/testsupermock/

# Или клонировать с Git
git clone https://github.com/your-repo/supermock.git /opt/testsupermock
```

---

## 🔧 **ШАГ 3: НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ**

### 📝 **Создание .env.test:**
```bash
cd /opt/testsupermock
cp deploy/test.env.example .env.test
nano .env.test
```

### 🔑 **Заполнить переменные:**
```env
# База данных
POSTGRES_PASSWORD_TEST=your_secure_password_here
POSTGRES_DB_TEST=supermock_test
POSTGRES_USER_TEST=supermock_test

# Telegram Bot (тестовый)
TELEGRAM_BOT_TOKEN_TEST=8213869730:AAHIR0oUPS-sfyMvwzStYapJYc7YH4lMlS4
VITE_TELEGRAM_BOT_NAME_TEST=SuperMockTest_bot
VITE_TELEGRAM_BOT_ID_TEST=8213869730

# URLs
FRONTEND_URL_TEST=https://test.supermock.ru
BACKEND_URL_TEST=https://test.supermock.ru/api
CORS_ORIGIN_TEST=https://test.supermock.ru

# TURN Server
TURN_REALM_TEST=test.supermock.ru
TURN_AUTH_SECRET_TEST=your_turn_secret_here
TURN_SERVER_HOST_TEST=test.supermock.ru

# Внешний IP сервера
EXTERNAL_IP=your-server-ip-here
```

---

## 🐳 **ШАГ 4: ЗАПУСК DOCKER СЕРВИСОВ**

### 🚀 **Автоматический деплой:**
```bash
cd /opt/testsupermock
chmod +x deploy-test.sh
./deploy-test.sh
```

### 📊 **Проверка статуса:**
```bash
# Статус контейнеров
docker compose -f docker-compose.test.yml --env-file .env.test ps

# Логи
docker compose -f docker-compose.test.yml --env-file .env.test logs -f
```

---

## 🔒 **ШАГ 5: НАСТРОЙКА SSL СЕРТИФИКАТА**

### 📜 **Получение Let's Encrypt сертификата:**
```bash
# Остановить nginx контейнер временно
docker compose -f docker-compose.test.yml --env-file .env.test stop nginx-test

# Получить сертификат
sudo certbot certonly --standalone -d test.supermock.ru

# Проверить сертификат
sudo certbot certificates
```

### 🔧 **Настройка Nginx с SSL:**
```bash
# Обновить nginx конфигурацию
sudo nano /opt/testsupermock/nginx/test-nginx.conf
```

### 📝 **Добавить SSL блок:**
```nginx
server {
    listen 80;
    server_name test.supermock.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name test.supermock.ru;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/test.supermock.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/test.supermock.ru/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Остальная конфигурация...
    location / {
        proxy_pass http://frontend-test:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://backend-test:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://backend-test:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 🔄 **Перезапуск с SSL:**
```bash
# Обновить docker-compose для монтирования SSL сертификатов
docker compose -f docker-compose.test.yml --env-file .env.test down
docker compose -f docker-compose.test.yml --env-file .env.test up -d
```

---

## 🔍 **ШАГ 6: ПРОВЕРКА РАБОТЫ**

### 🌐 **Проверка доступности:**
```bash
# HTTP редирект на HTTPS
curl -I http://test.supermock.ru

# HTTPS доступность
curl -I https://test.supermock.ru

# API endpoint
curl https://test.supermock.ru/api/health
```

### 📊 **Проверка контейнеров:**
```bash
# Статус всех сервисов
docker compose -f docker-compose.test.yml --env-file .env.test ps

# Логи nginx
docker compose -f docker-compose.test.yml --env-file .env.test logs nginx-test

# Логи backend
docker compose -f docker-compose.test.yml --env-file .env.test logs backend-test
```

---

## 🚨 **УСТРАНЕНИЕ ПРОБЛЕМ**

### ❌ **Если 404 ошибка:**
```bash
# Проверить, запущены ли контейнеры
docker compose -f docker-compose.test.yml --env-file .env.test ps

# Проверить логи
docker compose -f docker-compose.test.yml --env-file .env.test logs

# Проверить nginx конфигурацию
docker compose -f docker-compose.test.yml --env-file .env.test exec nginx-test nginx -t
```

### ❌ **Если SSL не работает:**
```bash
# Проверить сертификат
sudo certbot certificates

# Обновить сертификат
sudo certbot renew

# Проверить права доступа
sudo chmod 644 /etc/letsencrypt/live/test.supermock.ru/fullchain.pem
sudo chmod 600 /etc/letsencrypt/live/test.supermock.ru/privkey.pem
```

### ❌ **Если порты заняты:**
```bash
# Проверить занятые порты
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Остановить конфликтующие сервисы
sudo systemctl stop nginx  # если используете системный nginx
```

---

## 📋 **КОМАНДЫ ДЛЯ БЫСТРОГО ДЕПЛОЯ**

### 🚀 **Полный деплой одной командой:**
```bash
cd /opt/testsupermock && \
cp deploy/test.env.example .env.test && \
nano .env.test && \
chmod +x deploy-test.sh && \
./deploy-test.sh
```

### 🔄 **Обновление:**
```bash
cd /opt/testsupermock && \
git pull && \
docker compose -f docker-compose.test.yml --env-file .env.test down && \
./deploy-test.sh
```

### 🛑 **Остановка:**
```bash
cd /opt/testsupermock && \
docker compose -f docker-compose.test.yml --env-file .env.test down
```

---

## 🎯 **РЕЗУЛЬТАТ**

После выполнения всех шагов:
- ✅ **https://test.supermock.ru** - доступен с SSL
- ✅ **Telegram бот** - @SuperMockTest_bot работает
- ✅ **AI-ментор система** - полностью функциональна
- ✅ **WebRTC** - видео/аудио собеседования работают
- ✅ **Мультиязычность** - все 6 языков поддерживаются

---

**🎉 SUPERMOCK AI-MENTOR СИСТЕМА ГОТОВА К ТЕСТИРОВАНИЮ!**
