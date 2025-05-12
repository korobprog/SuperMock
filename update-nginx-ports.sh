#!/bin/bash

# Скрипт для обновления портов nginx на удаленном сервере
# Автор: Roo
# Дата: 13.05.2025

# Переменные (настройте под ваш сервер)
SERVER_USER="root"           # Имя пользователя сервера
SERVER_HOST="217.198.6.238"  # IP-адрес сервера
SERVER_PATH="/root/supermock" # Путь к приложению на сервере

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Создание временного скрипта для выполнения на сервере
log "Создание временного скрипта для выполнения на сервере..."
cat > update-nginx-ports-temp.sh << 'EOF'
#!/bin/bash

# Скрипт для обновления портов nginx на сервере
# Автор: Roo
# Дата: 13.05.2025

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Переход в директорию проекта
cd /root/supermock

# Создание резервной копии docker-compose.yml
log "Создание резервной копии docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.bak

# Обновление портов nginx в docker-compose.yml
log "Обновление портов nginx в docker-compose.yml..."
sed -i '/nginx:/,/networks:/ s/ports:\n      - .*:80/ports:\n      - \${NGINX_PORT:-80}:80\n      - '\''443:443'\''/g' docker-compose.yml

# Проверка, что порты обновлены
log "Проверка, что порты обновлены..."
grep -A 5 "nginx:" docker-compose.yml

# Перезапуск контейнера nginx
log "Перезапуск контейнера nginx..."
docker-compose up -d nginx

# Проверка, что порт 443 открыт
log "Проверка, что порт 443 открыт..."
ss -tulpn | grep 443

# Проверка логов nginx
log "Проверка логов nginx..."
sleep 5
docker logs nginx | tail -n 20

log "Готово! Проверьте, что контейнер nginx запустился без ошибок и порт 443 открыт."
EOF

# Копирование временного скрипта на сервер
log "Копирование временного скрипта на сервер..."
scp update-nginx-ports-temp.sh $SERVER_USER@$SERVER_HOST:$SERVER_PATH/update-nginx-ports.sh

if [ $? -ne 0 ]; then
  error "Ошибка при копировании временного скрипта на сервер."
fi

# Удаление временного скрипта
log "Удаление временного скрипта..."
rm update-nginx-ports-temp.sh

# Выполнение скрипта на сервере
log "Выполнение скрипта на сервере..."
ssh $SERVER_USER@$SERVER_HOST "chmod +x $SERVER_PATH/update-nginx-ports.sh && $SERVER_PATH/update-nginx-ports.sh"

if [ $? -ne 0 ]; then
  error "Ошибка при выполнении скрипта на сервере."
fi

log "Скрипт успешно выполнен!"
log "Проверьте, что контейнер nginx запустился без ошибок и порт 443 открыт."