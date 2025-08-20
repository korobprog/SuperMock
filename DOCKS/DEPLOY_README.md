# 🚀 Скрипты деплоя для SuperMock

Этот проект содержит набор скриптов для автоматизации деплоя и управления проектом.

## 📋 Доступные скрипты

### 🐧 Linux/macOS (bash)

- `quick-sync.sh` - Быстрая синхронизация конфигурации
- `sync-to-server.sh` - Синхронизация с проверкой MD5
- `deploy.sh` - Git-based деплой
- `rsync-deploy.sh` - Rsync синхронизация
- `Makefile` - Удобные команды через make

### 🪟 Windows

- `deploy.bat` - Batch файл для Windows
- `deploy.ps1` - PowerShell скрипт (рекомендуется)

## 🎯 Быстрый старт

### Windows (PowerShell)

```powershell
# Показать справку
.\deploy.ps1

# Быстрая синхронизация
.\deploy.ps1 quick-sync

# Установить зависимости
.\deploy.ps1 install

# Запустить в режиме разработки
.\deploy.ps1 dev

# Тестировать сервисы
.\deploy.ps1 test
```

### Windows (Batch)

```cmd
# Показать справку
deploy.bat

# Быстрая синхронизация
deploy.bat quick-sync

# Установить зависимости
deploy.bat install
```

### Linux/macOS

```bash
# Показать справку
make help

# Быстрая синхронизация
make quick-sync

# Установить зависимости
make install

# Запустить в режиме разработки
make dev

# Тестировать сервисы
make test
```

## 📦 Основные команды

### 🔄 Синхронизация и деплой

- `quick-sync` - Быстрая синхронизация основных файлов
- `sync` - Синхронизация с проверкой изменений
- `deploy` - Git-based деплой с коммитами
- `rsync` - Полная синхронизация кода

### 🛠️ Разработка

- `install` - Установить зависимости
- `build` - Собрать проект
- `dev` - Запустить в режиме разработки
- `clean` - Очистить node_modules

### 🗄️ База данных

- `db-up` - Поднять базы данных
- `db-down` - Остановить базы данных
- `db-studio` - Открыть Prisma Studio
- `db-migrate` - Запустить миграции

### 📊 Мониторинг

- `status` - Статус сервисов
- `logs` - Логи сервисов
- `test` - Тестирование сервисов
- `monitor` - Мониторинг системы

## 🔧 Настройка

### 1. SSH ключ

Убедитесь, что у вас есть SSH ключ для доступа к серверу:

```bash
# Проверить наличие ключа
ls ~/.ssh/timeweb_vps_key

# Если нет, создайте его
ssh-keygen -t rsa -b 4096 -f ~/.ssh/timeweb_vps_key
```

### 2. Настройки сервера

Отредактируйте файл `deploy.env`:

```env
SERVER=root@your-server-ip
SSH_KEY=~/.ssh/your-key
REMOTE_PATH=/opt/mockmate
```

### 3. Зависимости

Установите необходимые инструменты:

```bash
# pnpm
npm install -g pnpm

# Git (для Windows)
# Скачайте с https://git-scm.com/

# Docker (для сборки)
# Скачайте с https://docker.com/
```

## 🚨 Устранение неполадок

### Проблема: "make: command not found"

**Решение:** Используйте Windows скрипты:

```cmd
deploy.bat quick-sync
```

или

```powershell
.\deploy.ps1 quick-sync
```

### Проблема: "ssh: command not found"

**Решение:** Установите Git Bash или OpenSSH для Windows

### Проблема: "pnpm: command not found"

**Решение:** Установите pnpm:

```bash
npm install -g pnpm
```

### Проблема: "Permission denied" при SSH

**Решение:** Проверьте права на SSH ключ:

```bash
chmod 600 ~/.ssh/timeweb_vps_key
```

## 📝 Логи

Скрипты создают лог файлы:

- `deploy.log` - Логи синхронизации
- `rsync-deploy.log` - Логи rsync

Для очистки логов:

```bash
make clean-logs
```

## 🔒 Безопасность

- Все скрипты создают бэкапы перед изменениями
- SSH ключи должны иметь правильные права доступа
- Проверяйте изменения перед деплоем

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `make logs`
2. Проверьте статус: `make status`
3. Протестируйте сервисы: `make test`
4. Проверьте мониторинг: `make monitor`
