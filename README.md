# SuperMock - Инструкция по развертыванию

Это руководство описывает процесс развертывания приложения SuperMock с использованием Docker и Docker Compose, а также настройку Nginx на сервере в качестве обратного прокси. Приложение состоит из фронтенда на React, бэкенда на Node.js, базы данных MongoDB и кэша Redis.

## Предварительные требования

- Docker и Docker Compose установлены на сервере
- Nginx установлен на сервере
- Доменное имя (supermock.ru) настроено и указывает на IP-адрес сервера
- SSL-сертификаты Let's Encrypt уже настроены и доступны по путям:
  - `/etc/letsencrypt/live/supermock.ru/fullchain.pem`
  - `/etc/letsencrypt/live/supermock.ru/privkey.pem`

## Структура проекта

```
SuperMock/
├── docker-compose.yml         # Основной файл Docker Compose
├── nginx-server-config.conf   # Конфигурация Nginx для сервера
├── backend/                   # Директория бэкенда
│   ├── Dockerfile             # Dockerfile для бэкенда
│   └── ...                    # Исходный код бэкенда
└── react-frontend/            # Директория фронтенда
    ├── Dockerfile             # Dockerfile для фронтенда
    ├── nginx.conf             # Конфигурация Nginx для фронтенда
    ├── env.sh                 # Скрипт для замены переменных окружения
    └── ...                    # Исходный код фронтенда
```

## Запуск приложения

1. Клонируйте репозиторий:

   ```bash
   git clone https://github.com/yourusername/SuperMock.git
   cd SuperMock
   ```

2. Создайте файл `.env` с необходимыми переменными окружения:

   ```bash
   echo "JWT_SECRET=your_jwt_secret_key" > .env
   ```

3. Запустите приложение с помощью Docker Compose:

   ```bash
   docker-compose up -d
   ```

4. Проверьте, что все контейнеры запущены:
   ```bash
   docker-compose ps
   ```

## Настройка Nginx

После запуска Docker-контейнеров необходимо настроить Nginx на сервере:

1. Скопируйте файл конфигурации Nginx в директорию sites-available:

   ```bash
   sudo cp nginx-server-config.conf /etc/nginx/sites-available/supermock.ru
   ```

2. Создайте символическую ссылку в директории sites-enabled:

   ```bash
   sudo ln -s /etc/nginx/sites-available/supermock.ru /etc/nginx/sites-enabled/
   ```

3. Проверьте конфигурацию Nginx:

   ```bash
   sudo nginx -t
   ```

4. Перезагрузите Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## Проверка работоспособности

1. Откройте в браузере https://supermock.ru/ - должен загрузиться фронтенд
2. API доступно по адресу https://supermock.ru/api/

## Логирование и отладка

Все контейнеры настроены на ведение логов. Вы можете просмотреть логи с помощью следующих команд:

```bash
# Логи всех контейнеров
docker-compose logs

# Логи конкретного контейнера
docker-compose logs frontend
docker-compose logs backend

# Логи в реальном времени
docker-compose logs -f
```

Логи Nginx доступны в стандартных директориях:

```bash
sudo tail -f /var/log/nginx/supermock-access.log
sudo tail -f /var/log/nginx/supermock-error.log
```

## Возможные проблемы и их решение

### Проблема с доступом к SSL-сертификатам

Если контейнер Nginx не может получить доступ к SSL-сертификатам, убедитесь, что:

1. Пути к сертификатам указаны правильно в `docker-compose.yml`
2. Пользователь, от имени которого запускается Docker, имеет доступ к этим файлам

Решение:

```bash
sudo chmod -R 755 /etc/letsencrypt/live/
sudo chmod -R 755 /etc/letsencrypt/archive/
```

### Проблема с маршрутизацией запросов

Если запросы к API не проходят, проверьте:

1. Логи Nginx: `docker-compose logs nginx`
2. Конфигурацию Nginx: `docker exec supermock-nginx nginx -t`

### Проблема с переменными окружения

Если фронтенд не может подключиться к бэкенду, проверьте:

1. Переменные окружения в `docker-compose.yml`
2. Логи фронтенда: `docker-compose logs frontend`

## Обновление приложения

Для обновления приложения:

1. Остановите контейнеры:

   ```bash
   docker-compose down
   ```

2. Получите последние изменения:

   ```bash
   git pull
   ```

3. Пересоберите и запустите контейнеры:
   ```bash
   docker-compose up -d --build
   ```

## Резервное копирование данных

Данные MongoDB и Redis хранятся в Docker volumes. Для создания резервной копии:

```bash
# Создание резервной копии MongoDB
docker exec supermock-mongo mongodump --out=/data/db/backup

# Копирование резервной копии на хост
docker cp supermock-mongo:/data/db/backup ./mongo-backup
```
