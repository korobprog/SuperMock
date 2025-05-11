# Инструкция по развертыванию баз данных на сервере

Этот документ содержит инструкции по развертыванию MongoDB и Redis на сервере c641b068463c.vps.myjino.ru с использованием Docker.

## Предварительные требования

1. Доступ к серверу по SSH
2. Права sudo на сервере
3. Базовые знания Linux и Docker

## Шаги по развертыванию

### 1. Подготовка скрипта

Скрипт `deploy-db.sh` автоматизирует процесс развертывания баз данных на сервере. Он выполняет следующие действия:

- Создает необходимые файлы (docker-compose.yml, .env)
- Копирует их на сервер
- Устанавливает Docker и Docker Compose на сервере (если они еще не установлены)
- Запускает контейнеры с MongoDB и Redis
- Выводит информацию о подключении

### 2. Настройка прав на выполнение

```bash
chmod +x backend/deploy-db.sh
```

### 3. Запуск скрипта

```bash
./backend/deploy-db.sh <username> <server>
```

Где:

- `<username>` - имя пользователя на сервере
- `<server>` - адрес сервера (c641b068463c.vps.myjino.ru)

Пример:

```bash
./backend/deploy-db.sh root c641b068463c.vps.myjino.ru
```

### 4. Проверка развертывания

После успешного выполнения скрипта, вы можете подключиться к серверу и проверить статус контейнеров:

```bash
ssh <username>@c641b068463c.vps.myjino.ru
cd ~/supermook-db
docker-compose ps
```

## Настройка подключения к базам данных

### MongoDB

URI для подключения:

```
mongodb://admin:password@c641b068463c.vps.myjino.ru:27017/mock_interviews?authSource=admin
```

Не забудьте заменить `password` на пароль, указанный в файле `.env` на сервере.

### Redis

Параметры подключения:

- Host: c641b068463c.vps.myjino.ru
- Port: 6379
- Password: password (замените на пароль из файла `.env` на сервере)

## Настройка безопасности

По умолчанию, порты MongoDB и Redis доступны только с локального хоста (127.0.0.1). Для доступа извне вам нужно:

1. Изменить привязку портов в docker-compose.yml:

   ```yaml
   ports:
     - '0.0.0.0:27017:27017' # Для MongoDB
     - '0.0.0.0:6379:6379' # Для Redis
   ```

2. Настроить брандмауэр для разрешения доступа только с определенных IP-адресов:
   ```bash
   sudo ufw allow from <your-ip-address> to any port 27017
   sudo ufw allow from <your-ip-address> to any port 6379
   ```

## Обновление переменных окружения

Если вам нужно изменить пароли или другие параметры, отредактируйте файл `.env` на сервере:

```bash
ssh <username>@c641b068463c.vps.myjino.ru
cd ~/supermook-db
nano .env
```

После изменения переменных окружения перезапустите контейнеры:

```bash
docker-compose down
docker-compose up -d
```

## Резервное копирование данных

### MongoDB

```bash
docker-compose exec mongo mongodump --username admin --password <password> --out /data/backup
```

### Redis

Redis автоматически сохраняет данные на диск благодаря опции `--appendonly yes`.

## Мониторинг

Для просмотра логов контейнеров:

```bash
docker-compose logs mongo  # Логи MongoDB
docker-compose logs redis  # Логи Redis
```

Для мониторинга использования ресурсов:

```bash
docker stats
```

## Устранение неполадок

### Проблема: Не удается подключиться к базам данных

1. Проверьте, запущены ли контейнеры:

   ```bash
   docker-compose ps
   ```

2. Проверьте логи на наличие ошибок:

   ```bash
   docker-compose logs
   ```

3. Проверьте настройки брандмауэра:
   ```bash
   sudo ufw status
   ```

### Проблема: Ошибка аутентификации

1. Проверьте правильность учетных данных в файле `.env`
2. Перезапустите контейнеры после изменения учетных данных:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Дополнительная информация

Для получения дополнительной информации о Docker и Docker Compose, посетите:

- [Документация Docker](https://docs.docker.com/)
- [Документация Docker Compose](https://docs.docker.com/compose/)
