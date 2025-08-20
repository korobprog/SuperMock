# Makefile для деплоя
.PHONY: sync quick-sync deploy rsync help logs status restart backup clean-logs test install build dev

# Загружаем настройки
include deploy.env

help: ## Показать справку
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

sync: ## Синхронизация с проверкой MD5
	./sync-to-server.sh

quick-sync: ## Быстрая синхронизация
	./quick-sync.sh

deploy: ## Git-based деплой
	./deploy.sh

rsync: ## Rsync синхронизация
	./rsync-deploy.sh

status: ## Проверить статус сервисов
	ssh -i $(SSH_KEY) $(SERVER) "cd $(REMOTE_PATH) && docker-compose -f docker-compose.prod.yml ps"

logs: ## Показать логи
	ssh -i $(SSH_KEY) $(SERVER) "cd $(REMOTE_PATH) && docker-compose -f docker-compose.prod.yml logs --tail=50"

logs-frontend: ## Показать логи фронтенда
	ssh -i $(SSH_KEY) $(SERVER) "docker logs supermock-frontend --tail=50"

logs-backend: ## Показать логи бэкенда
	ssh -i $(SSH_KEY) $(SERVER) "docker logs supermock-backend --tail=50"

logs-traefik: ## Показать логи Traefik
	ssh -i $(SSH_KEY) $(SERVER) "docker logs traefik --tail=50"

restart: ## Перезапустить все сервисы
	ssh -i $(SSH_KEY) $(SERVER) "cd $(REMOTE_PATH) && docker-compose -f docker-compose.prod.yml restart"
	ssh -i $(SSH_KEY) $(SERVER) "cd $(REMOTE_PATH)/traefik && docker-compose restart"

backup: ## Создать бэкап на сервере
	ssh -i $(SSH_KEY) $(SERVER) "cd $(REMOTE_PATH) && tar -czf backup-$(shell date +%Y%m%d_%H%M%S).tar.gz docker-compose.prod.yml traefik/ backend/ frontend/"

clean-logs: ## Очистить локальные лог файлы
	rm -f deploy.log rsync-deploy.log

test: ## Тестировать сервисы
	@echo "🌐 Тестируем сайт..."
	@if curl -s -o /dev/null -w "%{http_code}" https://supermock.ru | grep -q "200"; then \
		echo "✅ Сайт работает: https://supermock.ru"; \
	else \
		echo "❌ Проблема с сайтом: https://supermock.ru"; \
	fi
	@echo "🔌 Тестируем API..."
	@if curl -s -o /dev/null -w "%{http_code}" https://api.supermock.ru/api/health | grep -q "200"; then \
		echo "✅ API работает: https://api.supermock.ru/api/health"; \
	else \
		echo "❌ Проблема с API: https://api.supermock.ru/api/health"; \
	fi

monitor: ## Мониторинг сервисов
	@echo "📊 Статус сервисов:"
	@ssh -i $(SSH_KEY) $(SERVER) "cd $(REMOTE_PATH) && docker-compose -f docker-compose.prod.yml ps"
	@echo ""
	@echo "💾 Использование диска:"
	@ssh -i $(SSH_KEY) $(SERVER) "df -h $(REMOTE_PATH)"
	@echo ""
	@echo "🧠 Использование памяти:"
	@ssh -i $(SSH_KEY) $(SERVER) "free -h"

info: ## Информация о системе
	@echo "🖥️ Информация о сервере:"
	@ssh -i $(SSH_KEY) $(SERVER) "uname -a"
	@echo ""
	@echo "🐳 Docker версия:"
	@ssh -i $(SSH_KEY) $(SERVER) "docker --version"
	@echo ""
	@echo "📦 Docker Compose версия:"
	@ssh -i $(SSH_KEY) $(SERVER) "docker-compose --version"

# Команды для работы с package.json и pnpm
install: ## Установить зависимости
	pnpm install

install-prod: ## Установить только production зависимости
	pnpm install --prod

update: ## Обновить зависимости
	pnpm update

add: ## Добавить зависимость (использование: make add pkg=package-name)
	@if [ -z "$(pkg)" ]; then \
		echo "❌ Укажите пакет: make add pkg=package-name"; \
		exit 1; \
	fi
	pnpm add $(pkg)

add-dev: ## Добавить dev зависимость (использование: make add-dev pkg=package-name)
	@if [ -z "$(pkg)" ]; then \
		echo "❌ Укажите пакет: make add-dev pkg=package-name"; \
		exit 1; \
	fi
	pnpm add -D $(pkg)

remove: ## Удалить зависимость (использование: make remove pkg=package-name)
	@if [ -z "$(pkg)" ]; then \
		echo "❌ Укажите пакет: make remove pkg=package-name"; \
		exit 1; \
	fi
	pnpm remove $(pkg)

build: ## Собрать проект
	pnpm run build

build-frontend: ## Собрать только фронтенд
	pnpm run build

dev: ## Запустить в режиме разработки
	pnpm run dev

dev-prod: ## Запустить в production режиме локально
	pnpm run dev:prod

client: ## Запустить только клиент
	pnpm run client

server: ## Запустить только сервер
	pnpm run server

server-prod: ## Запустить сервер в production режиме
	pnpm run server:prod

lint: ## Запустить линтер
	pnpm run lint

db-up: ## Поднять базы данных
	pnpm run db:up

db-down: ## Остановить базы данных
	pnpm run db:down

db-studio: ## Открыть Prisma Studio
	pnpm run db:studio

db-migrate: ## Запустить миграции
	pnpm run db:migrate

db-generate: ## Сгенерировать Prisma клиент
	pnpm run db:generate

clean: ## Очистить node_modules и кэш
	rm -rf node_modules
	rm -rf frontend/node_modules
	rm -rf backend/node_modules
	rm -rf frontend/dist
	pnpm store prune

clean-install: clean install ## Полная переустановка зависимостей

# Команды для работы с Docker
docker-build: ## Собрать Docker образы
	docker-compose -f docker-compose.prod.yml build

docker-build-frontend: ## Собрать только frontend образ
	docker-compose -f docker-compose.prod.yml build frontend

docker-build-backend: ## Собрать только backend образ
	docker-compose -f docker-compose.prod.yml build backend

docker-push: ## Отправить образы в registry (если настроен)
	docker-compose -f docker-compose.prod.yml push

# Команды для проверки
check-deps: ## Проверить устаревшие зависимости
	pnpm outdated

check-security: ## Проверить уязвимости
	pnpm audit

fix-security: ## Исправить уязвимости
	pnpm audit fix

# Команды для разработки
setup: install db-up ## Настройка проекта для разработки

start: dev ## Запустить проект (alias для dev)

stop: db-down ## Остановить проект
