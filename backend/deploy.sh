#!/bin/bash

# Скрипт для ручного деплоя бэкенда на сервер

# Переменные (настроены для вашего сервера)
DOCKER_USERNAME="makstreid"  # Имя пользователя Docker Hub
DOCKER_PASSWORD=""           # Пароль Docker Hub (оставьте пустым для интерактивного ввода)
SERVER_USER="root"           # Имя пользователя сервера
SERVER_HOST="217.198.6.238"  # IP-адрес сервера
SERVER_PATH="/root/supermock"           # Путь к приложению на сервере

# Запрос пароля Docker Hub, если он не указан
if [ -z "$DOCKER_PASSWORD" ]; then
  read -sp "Введите пароль для Docker Hub ($DOCKER_USERNAME): " DOCKER_PASSWORD
  echo ""
fi

# Проверка незамененных переменных
if [ "$DOCKER_USERNAME" = "username" ]; then
  error "DOCKER_USERNAME не изменен с значения по умолчанию. Пожалуйста, укажите ваше имя пользователя Docker Hub."
fi

if [ "$SERVER_USER" = "user" ]; then
  error "SERVER_USER не изменен с значения по умолчанию. Пожалуйста, укажите имя пользователя сервера."
fi

if [ "$SERVER_HOST" = "server_ip" ]; then
  error "SERVER_HOST не изменен с значения по умолчанию. Пожалуйста, укажите IP-адрес или хост сервера."
fi

if [ "$SERVER_PATH" = "/path/to/app" ]; then
  error "SERVER_PATH не изменен с значения по умолчанию. Пожалуйста, укажите путь к приложению на сервере."
fi

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

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
  error "Docker не установлен. Установите Docker и повторите попытку."
fi

# Проверка статуса Docker
log "Проверка статуса Docker..."
docker info &> /dev/null
if [ $? -ne 0 ]; then
  error "Docker не запущен или не настроен правильно. Убедитесь, что Docker Desktop запущен."
fi

# Проверка Docker Engine
log "Проверка Docker Engine..."
docker version --format '{{.Server.Os}}-{{.Server.Arch}}' &> /dev/null
if [ $? -ne 0 ]; then
  error "Не удалось подключиться к Docker Engine. Убедитесь, что Docker Desktop запущен и правильно настроен."
fi

# Проверка WSL2 (для Windows)
if [[ "$(uname -s)" == *"MINGW"* ]] || [[ "$(uname -s)" == *"MSYS"* ]] || [[ "$(uname -s)" == *"CYGWIN"* ]]; then
  log "Обнаружена Windows. Проверка WSL2..."
  wsl --status &> /dev/null
  if [ $? -ne 0 ]; then
    warn "WSL2 не настроен или не запущен. Это может вызывать проблемы с Docker на Windows."
  fi
fi

# Сборка Docker образа
log "Сборка Docker образа..."
log "Используем Docker username: $DOCKER_USERNAME"
log "Текущая директория: $(pwd)"
log "Проверка наличия Dockerfile: $(ls -la | grep Dockerfile || echo 'Dockerfile не найден')"
# Используем флаг --no-cache, чтобы гарантировать полную пересборку образа
docker build -t $DOCKER_USERNAME/mock-interviews-backend ./ --no-cache

# Проверка успешности сборки
if [ $? -ne 0 ]; then
  error "Ошибка при сборке Docker образа."
fi

# Проверка настроек прокси в Docker
log "Проверка настроек прокси в Docker..."
docker info | grep -i proxy || log "Настройки прокси не обнаружены"

# Проверка аутентификации в Docker Hub
log "Проверка аутентификации в Docker Hub..."
docker info | grep "Username" > /dev/null
if [ $? -ne 0 ]; then
  log "Аутентификация в Docker Hub не обнаружена. Выполняется вход..."
  # Попытка выхода из Docker Hub перед входом
  docker logout
  log "Выполнен выход из Docker Hub. Повторная попытка входа..."
  echo "$DOCKER_PASSWORD" | docker login -u $DOCKER_USERNAME --password-stdin
  if [ $? -ne 0 ]; then
    error "Ошибка аутентификации в Docker Hub. Проверьте учетные данные."
  fi
  log "Аутентификация в Docker Hub успешна"
else
  log "Обнаружена существующая аутентификация в Docker Hub. Выполняем повторный вход для обновления..."
  docker logout
  echo "$DOCKER_PASSWORD" | docker login -u $DOCKER_USERNAME --password-stdin
  if [ $? -ne 0 ]; then
    error "Ошибка аутентификации в Docker Hub. Проверьте учетные данные."
  fi
  log "Аутентификация в Docker Hub успешна"
fi

# Проверка конфигурации Docker
log "Проверка конфигурации Docker..."
if [ -f "$HOME/.docker/config.json" ]; then
  log "Файл конфигурации Docker существует"
  # Выводим содержимое файла конфигурации без секретов
  grep -v "auth" "$HOME/.docker/config.json" || log "Не удалось прочитать файл конфигурации"
else
  log "Файл конфигурации Docker не найден"
fi

# Проверка сетевого соединения с Docker Hub
log "Проверка сетевого соединения с Docker Hub..."
ping -c 3 registry-1.docker.io || log "Не удалось выполнить ping до Docker Hub"

# Отправка образа в Docker Hub
log "Отправка образа в Docker Hub ($DOCKER_USERNAME/mock-interviews-backend)..."
# Добавляем флаг --verbose для получения дополнительной информации
docker push --verbose $DOCKER_USERNAME/mock-interviews-backend

# Проверка успешности отправки
if [ $? -ne 0 ]; then
  log "Проверка настроек прокси в системе..."
  env | grep -i proxy || log "Системные настройки прокси не обнаружены"
  
  log "Попытка отключения прокси для Docker..."
  # Создаем или обновляем файл daemon.json для отключения прокси
  mkdir -p "$HOME/.docker"
  echo '{ "proxies": { "default": { "httpProxy": "", "httpsProxy": "", "noProxy": "" } } }' > "$HOME/.docker/daemon.json"
  log "Файл daemon.json создан/обновлен. Попытка перезапуска Docker..."
  
  # Повторная попытка отправки образа
  log "Повторная попытка отправки образа..."
  docker push $DOCKER_USERNAME/mock-interviews-backend
  
  if [ $? -ne 0 ]; then
    error "Ошибка при отправке образа в Docker Hub. Проверьте, что вы авторизованы (docker login) и настройки прокси."
  fi
fi

# Проверка наличия необходимых файлов
if [ ! -f "docker-compose.yml" ]; then
  error "Файл docker-compose.yml не найден в текущей директории. Убедитесь, что вы запускаете скрипт из директории backend."
fi

if [ ! -f ".env.production" ]; then
  error "Файл .env.production не найден в текущей директории. Убедитесь, что вы запускаете скрипт из директории backend."
fi

# Проверка содержимого .env.production
if grep -q "<username>" .env.production || grep -q "<password>" .env.production || grep -q "<cluster>" .env.production; then
  error "В файле .env.production найдены незамененные плейсхолдеры. Пожалуйста, замените <username>, <password> и <cluster> на реальные значения."
fi

if ! grep -q "DOCKER_USERNAME" .env.production; then
  warn "В файле .env.production не найдена переменная DOCKER_USERNAME. Рекомендуется добавить её для использования в docker-compose.yml."
fi

# Копирование docker-compose.yml и .env.production на сервер
log "Копирование файлов на сервер ($SERVER_USER@$SERVER_HOST:$SERVER_PATH)..."
scp -v docker-compose.yml .env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Проверка успешности копирования
if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов на сервер. Проверьте подключение и права доступа."
fi

# Остановка и удаление локальных контейнеров перед деплоем
log "Остановка и удаление локальных контейнеров..."
docker stop supermock-backend || echo "Контейнер supermock-backend не запущен"
docker rm supermock-backend || echo "Контейнер supermock-backend не существует"

# Подключение к серверу и запуск контейнеров
log "Запуск контейнеров на сервере ($SERVER_USER@$SERVER_HOST)..."
ssh -v $SERVER_USER@$SERVER_HOST "export DOCKER_USERNAME=\"$DOCKER_USERNAME\" && export DOCKER_PASSWORD=\"$DOCKER_PASSWORD\" && cd $SERVER_PATH && \
  echo 'Текущая директория: \$(pwd)' && \
  mv .env.production .env && \
  echo 'Файл .env создан' && \
  echo '=== Проверка процессов, использующих порт 80 (метод 1) ===' && \
  ss -tulpn | grep ':80' || echo 'Команда ss не найдена' && \
  echo '=== Проверка процессов, использующих порт 80 (метод 2) ===' && \
  lsof -i :80 || echo 'Команда lsof не найдена' && \
  echo '=== Проверка запущенных контейнеров ===' && \
  docker ps -a && \
  echo '=== Проверка запущенных сервисов ===' && \
  systemctl list-units --type=service --state=running | grep -E 'nginx|apache|httpd' || echo 'Команда systemctl не найдена' && \
  echo '=== Проверка, какие порты используют Docker-контейнеры ===' && \
  docker ps --format '{{.Names}} - {{.Ports}}' && \
  echo '=== Остановка всех контейнеров ===' && \
  docker stop \$(docker ps -a -q) || echo 'Нет запущенных контейнеров' && \
  echo '=== Удаление всех контейнеров ===' && \
  docker rm \$(docker ps -a -q) || echo 'Нет контейнеров для удаления' && \
  echo '=== Остановка контейнеров через docker-compose ===' && \
  docker-compose down && \
  echo 'Старые контейнеры остановлены' && \
  echo '=== Повторная проверка порта 80 ===' && \
  ss -tulpn | grep ':80' || lsof -i :80 || echo 'Команды ss и lsof не найдены' && \
  echo '=== Проверка порта 8080 ===' && \
  ss -tulpn | grep ':8080' || lsof -i :8080 || echo 'Команды ss и lsof не найдены' && \
  echo '=== Проверка порта 9090 ===' && \
  ss -tulpn | grep ':9090' || lsof -i :9090 || echo 'Команды ss и lsof не найдены' && \
  echo '=== Проверка порта 9091 ===' && \
  ss -tulpn | grep ':9091' || lsof -i :9091 || echo 'Команды ss и lsof не найдены' && \
  echo '=== Проверка порта 9092 ===' && \
  ss -tulpn | grep ':9092' || lsof -i :9092 || echo 'Команды ss и lsof не найдены' && \
  echo '=== Изменение портов в docker-compose.yml ===' && \
  echo '--- Содержимое docker-compose.yml до изменений ---' && \
  cat docker-compose.yml && \
  echo '--- Секция ports до изменений ---' && \
  cat docker-compose.yml | grep -A 10 'ports:' && \
  echo '--- Применение изменений портов ---' && \
  # Проверка занятости портов
  echo '=== Проверка занятости портов на сервере ===' && \
  netstat -tulpn | grep -E ':9092|:9093|:9094|:9095' || echo 'Команда netstat не найдена' && \
  
  # Более точные регулярные выражения для замены портов
  # Используем порт 9095 вместо 9092, так как 9092 уже занят
  sed -i 's/- .\?0.0.0.0:80:80.\?/- 0.0.0.0:9091:80/' docker-compose.yml && \
  sed -i 's/- .\?0.0.0.0:8080:8080.\?/- 0.0.0.0:9095:8080/' docker-compose.yml && \
  sed -i 's/- .\?0.0.0.0:9090:80.\?/- 0.0.0.0:9091:80/' docker-compose.yml && \
  sed -i 's/- .\?0.0.0.0:9090:8080.\?/- 0.0.0.0:9095:8080/' docker-compose.yml && \
  sed -i 's/- .\?0.0.0.0:9092:9092.\?/- 0.0.0.0:9096:9092/' docker-compose.yml && \
  sed -i 's/- .\?0.0.0.0:443:443.\?/- 0.0.0.0:8443:443/' docker-compose.yml && \
  echo '--- Секция ports после изменений ---' && \
  cat docker-compose.yml | grep -A 10 'ports:' && \
  echo '=== Аутентификация в Docker Hub ===' && \
  echo "$DOCKER_PASSWORD" | docker login -u $DOCKER_USERNAME --password-stdin && \
  if [ $? -ne 0 ]; then
    echo 'Ошибка аутентификации в Docker Hub. Проверьте учетные данные.' && exit 1
  fi && \
  echo 'Аутентификация в Docker Hub успешна' && \
  echo '=== Запуск новых контейнеров ===' && \
  docker pull $DOCKER_USERNAME/mock-interviews-backend && \
  echo 'Образ успешно загружен' && \
  docker-compose up -d && \
  echo 'Новые контейнеры запущены' && \
  docker image prune -af && \
  echo 'Неиспользуемые образы удалены' && \
  docker ps | grep mock-interviews"

# Проверка успешности запуска
if [ $? -ne 0 ]; then
  error "Ошибка при запуске контейнеров на сервере."
fi

log "Деплой успешно завершен!"