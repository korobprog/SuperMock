# 🚀 Настройка CI/CD для автоматического деплоя

## 📋 Обзор

Этот workflow автоматически деплоит ваш проект на production сервер при каждом push в ветку `main`.

## ⚙️ Настройка GitHub Secrets

Для работы CI/CD необходимо настроить следующие секреты в репозитории:

### 1. Перейдите в настройки репозитория
```
GitHub Repository → Settings → Secrets and variables → Actions
```

### 2. Добавьте следующие секреты:

#### 🔑 DEPLOY_HOST
```
217.198.6.238
```

#### 👤 DEPLOY_USER
```
root
```

#### 🔐 DEPLOY_SSH_KEY
Содержимое вашего приватного SSH ключа:
```
-----BEGIN OPENSSH PRIVATE KEY-----
... содержимое ключа ...
-----END OPENSSH PRIVATE KEY-----
```

#### 📁 DEPLOY_PATH
```
/opt/mockmate
```

## 🚀 Как это работает

### Автоматический запуск
- **Push в main** → автоматический деплой
- **Pull Request в main** → только сборка и тесты

### Ручной запуск
1. Перейдите в **Actions** → **Deploy to Production Server**
2. Нажмите **Run workflow**
3. Выберите ветку и окружение
4. Нажмите **Run workflow**

## 📊 Этапы CI/CD

### 1. 🔨 Build and Test
- Установка зависимостей (pnpm)
- Генерация Prisma клиента
- Сборка frontend, backend, landing
- Запуск тестов

### 2. 🐳 Build Docker Images
- Создание Docker образов для всех сервисов
- Кэширование слоев для ускорения сборки

### 3. 🚀 Deploy to Production
- Создание резервной копии
- Остановка текущих контейнеров
- Развертывание нового кода
- Проверка health check
- Тестирование доступности сервисов
- Перезапуск Traefik

### 4. 📢 Notifications
- Уведомления об успехе/ошибке деплоя

## 🛡️ Безопасность

### Резервные копии
- Автоматическое создание backup перед каждым деплоем
- Возможность быстрого отката при проблемах

### Health Checks
- Проверка состояния всех критических сервисов
- Автоматическая остановка деплоя при ошибках

### Переменные окружения
- Автоматическое добавление недостающих переменных
- Безопасное хранение секретов в GitHub

## 🔍 Мониторинг

### Логи деплоя
- Подробные логи каждого этапа
- Время выполнения операций
- Статус каждого сервиса

### Проверки после деплоя
- ✅ Статус контейнеров
- ✅ Health check сервисов
- ✅ Доступность API
- ✅ Доступность frontend
- ✅ Доступность landing

## 🚨 Устранение неполадок

### Деплой не запускается
1. Проверьте настройку GitHub Secrets
2. Убедитесь, что SSH ключ корректный
3. Проверьте доступность сервера

### Ошибки при деплое
1. Проверьте логи в GitHub Actions
2. Проверьте статус контейнеров на сервере
3. Проверьте доступность портов

### Откат к предыдущей версии
```bash
# На сервере
cd /opt/mockmate
docker-compose -f docker-compose.prod-multi.yml down
# Восстановите backup
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz
docker-compose -f docker-compose.prod-multi.yml up -d
```

## 📝 Примеры использования

### Быстрый деплой
```bash
git add .
git commit -m "feat: новая функциональность"
git push origin main
# Деплой запустится автоматически
```

### Деплой конкретной ветки
```bash
git checkout feature/new-feature
git push origin feature/new-feature
# Создайте Pull Request в main
# После merge деплой запустится автоматически
```

### Ручной деплой
1. GitHub → Actions → Deploy to Production Server
2. Run workflow
3. Выберите ветку
4. Run workflow

## 🔧 Кастомизация

### Добавление новых сервисов
1. Обновите `docker-compose.prod-multi.yml`
2. Добавьте этап сборки в workflow
3. Обновите health checks

### Изменение окружения
1. Создайте новый environment в GitHub
2. Обновите workflow для поддержки staging
3. Настройте соответствующие secrets

### Добавление уведомлений
1. Интеграция с Slack/Discord/Telegram
2. Email уведомления
3. Webhook для внешних систем

## 📚 Полезные ссылки

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [SSH Action Documentation](https://github.com/appleboy/ssh-action)

## 🎯 Лучшие практики

1. **Всегда тестируйте** изменения в staging перед production
2. **Мониторьте логи** после каждого деплоя
3. **Используйте feature branches** для разработки
4. **Создавайте резервные копии** перед критическими изменениями
5. **Настройте алерты** для мониторинга сервисов
6. **Документируйте изменения** в commit сообщениях
7. **Проверяйте security** зависимостей регулярно
