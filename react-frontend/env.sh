#!/bin/sh

# Скрипт для замены переменных окружения в HTML файлах при запуске контейнера
# Это позволяет передавать переменные окружения в статические файлы React

# Путь к директории с HTML файлами
HTML_DIR=/usr/share/nginx/html

# Функция для логирования
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Запуск скрипта замены переменных окружения..."

# Получаем список всех переменных окружения, начинающихся с VITE_
ENV_VARS=$(printenv | grep -E '^VITE_' || echo "")

if [ -z "$ENV_VARS" ]; then
  log "Переменные окружения VITE_ не найдены"
else
  log "Найдены следующие переменные окружения VITE_:"
  echo "$ENV_VARS"
  
  # Создаем JavaScript файл с переменными окружения
  log "Создаем файл env-config.js..."
  
  # Начало файла
  echo "window.env = {" > $HTML_DIR/env-config.js
  
  # Добавляем каждую переменную в файл
  printenv | grep -E '^VITE_' | while read -r line; do
    # Разделяем строку на имя и значение
    name=$(echo $line | cut -d '=' -f 1)
    value=$(echo $line | cut -d '=' -f 2-)
    
    # Добавляем в файл
    echo "  \"$name\": \"$value\"," >> $HTML_DIR/env-config.js
  done
  
  # Закрываем объект
  echo "};" >> $HTML_DIR/env-config.js
  
  log "Файл env-config.js создан"
  
  # Добавляем скрипт в index.html, если его еще нет
  if grep -q "env-config.js" $HTML_DIR/index.html; then
    log "Скрипт env-config.js уже добавлен в index.html"
  else
    log "Добавляем скрипт env-config.js в index.html..."
    sed -i 's/<head>/<head>\n  <script src="\/env-config.js"><\/script>/' $HTML_DIR/index.html
    log "Скрипт добавлен в index.html"
  fi
fi

log "Скрипт замены переменных окружения завершен"