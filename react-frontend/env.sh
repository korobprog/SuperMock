#!/bin/sh

# Скрипт для замены переменных окружения в JS-файлах во время запуска контейнера

# Логирование для отладки
echo "Запуск скрипта замены переменных окружения"
echo "Текущие переменные окружения:"
env | grep VITE_

# Находим все JS-файлы в директории с собранными файлами
JS_FILES=$(find /usr/share/nginx/html -type f -name "*.js")

# Заменяем переменные окружения в JS-файлах
for file in $JS_FILES; do
  echo "Обработка файла: $file"
  
  # Заменяем все переменные окружения, начинающиеся с VITE_
  for var in $(env | grep -o '^VITE_[^=]*'); do
    value=$(eval echo \$$var)
    echo "  Замена $var на $value"
    sed -i "s|__${var}__|${value}|g" $file
  done
done

echo "Замена переменных окружения завершена"