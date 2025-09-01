# 🚀 CI/CD - Быстрый старт

## ⚡ Что нужно сделать за 5 минут

### 1. Настройте GitHub Secrets
```
GitHub Repository → Settings → Secrets and variables → Actions
```

Добавьте:
- `DEPLOY_HOST`: `217.198.6.238`
- `DEPLOY_USER`: `root`
- `DEPLOY_SSH_KEY`: содержимое `~/.ssh/timeweb_vps_key`
- `DEPLOY_PATH`: `/opt/mockmate`

### 2. Переименуйте ветку master в main
```bash
git branch -m master main
git push origin main
git push origin --delete master
```

### 3. Запустите деплой
```bash
git add .
git commit -m "feat: настройка CI/CD"
git push origin main
```

## 🎯 Что происходит автоматически

1. **Push в main** → запуск CI/CD
2. **Сборка и тесты** → проверка кода
3. **Создание Docker образов** → подготовка к деплою
4. **Деплой на сервер** → обновление production
5. **Проверка работоспособности** → health checks

## 📊 Мониторинг

- **GitHub Actions** → следите за процессом
- **Логи** → детальная информация о каждом этапе
- **Статус** → уведомления об успехе/ошибке

## 🔧 Полезные команды

```bash
# Проверка CI/CD конфигурации
./scripts/test-ci-cd.sh

# Ручной запуск workflow
# GitHub → Actions → Deploy to Production Server → Run workflow

# Проверка статуса на сервере
ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "docker ps --filter 'name=supermock'"
```

## 🚨 Если что-то пошло не так

1. **Проверьте GitHub Secrets** - все ли настроено
2. **Посмотрите логи** в GitHub Actions
3. **Проверьте сервер** - доступность и статус контейнеров
4. **Откатитесь** к предыдущей версии из backup

## 📚 Подробная документация

- [Полная настройка CI/CD](.github/SETUP_CI_CD.md)
- [Проблемы и решения](DOCKS/DEPLOYMENT_ISSUES_SOLUTIONS.md)

---

**🎉 После настройки: каждый push в main = автоматический деплой!**
